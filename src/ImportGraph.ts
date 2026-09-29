import * as fs from 'fs';
import * as path from 'path';
import { blankOutComments } from './utils';

// Limits import graph traversal in case of pathological import graphs
export const MAX_IMPORTED_FILES = 64;

/** Structurally compatible with the language server's `Range`, without depending on it */
export interface SourceRange {
  start: { line: number; character: number };
  end: { line: number; character: number };
}

/** An `import` directive, with the range of the full statement in the source */
export interface ImportStatement {
  path: string;
  range: SourceRange;
}

/** A file reached from a document's import directives */
export interface ImportedFile {
  /**
   * The name cashc identifies the file by, which is also its key in `compileString`'s `files`
   * option: `package:<path>` for files inside packages, and a normalised POSIX path relative to
   * the document for the rest
   */
  logicalPath: string;
  content: string;
}

/**
 * An import directive that cashc rejects while it resolves imports from disk. The compiler only
 * sees the files that were read here, so it cannot report these itself.
 */
export interface ImportFailure {
  /** Logical path of the file containing the directive, undefined for the document itself */
  importer?: string;
  statement: ImportStatement;
  message: string;
}

/** One of the document's own import directives, and how it resolved */
export interface DocumentImport {
  statement: ImportStatement;
  /** The imported file's logical path, undefined for (unsupported) absolute import paths */
  logicalPath?: string;
  /** The first rejected directive among this import and the files it (transitively) imports */
  failure?: ImportFailure;
}

/** The (transitive) import graph of a document, read from disk */
export interface ImportGraph {
  documentImports: DocumentImport[];
  files: ImportedFile[];
}

const IMPORT_REGEX = /^([ \t]*)(import\s+(["'])(.*?)\3\s*;)/gm;

export function parseImportStatements(code: string): ImportStatement[] {
  const codeWithoutComments = blankOutComments(code);

  return Array.from(codeWithoutComments.matchAll(IMPORT_REGEX)).map((match) => {
    const line = codeWithoutComments.slice(0, match.index).split('\n').length - 1;
    const startCharacter = match[1].length;

    return {
      path: match[4],
      range: {
        start: { line, character: startCharacter },
        end: { line, character: startCharacter + match[2].length },
      },
    };
  });
}

// Mirrors cashc: an import path that is not explicitly relative or absolute refers to a file
// inside an npm package, and is resolved from node_modules (CashScript 0.14+)
export function isPackageImport(importPath: string): boolean {
  return !importPath.startsWith('./') && !importPath.startsWith('../') && !importPath.startsWith('/');
}

const PACKAGE_PREFIX = 'package:';

/**
 * Mirrors cashc's logical paths: package imports are named `package:<import path>` regardless of
 * the importing file, while relative imports are joined onto the importing file's directory, so
 * relative imports inside a package stay in the `package:` namespace.
 */
function resolveLogicalPath(importerLogicalPath: string | undefined, importPath: string): string {
  if (isPackageImport(importPath)) return mapLogicalPath(`${PACKAGE_PREFIX}${importPath}`, path.posix.normalize);

  const importerDir = importerLogicalPath === undefined ? '.' : mapLogicalPath(importerLogicalPath, path.posix.dirname);
  return mapLogicalPath(importerDir, (dir) => path.posix.join(dir, importPath));
}

// Applies a path operation to a logical path, keeping its `package:` prefix in place
function mapLogicalPath(logicalPath: string, operation: (filePath: string) => string): string {
  if (!logicalPath.startsWith(PACKAGE_PREFIX)) return operation(logicalPath);
  return `${PACKAGE_PREFIX}${operation(logicalPath.slice(PACKAGE_PREFIX.length))}`;
}

// An imported file, with the real path on disk that its own imports are resolved from
interface LocatedFile {
  logicalPath: string;
  location: string;
}

type ImportResolution = Omit<DocumentImport, 'statement'>;

/**
 * Reads the document's (transitive) import graph from disk. The graph is walked depth-first,
 * like cashc does, so the same directive is rejected when two copies of a package are imported.
 * Files that cannot be read are left out, so the compiler reports them on the import directive.
 */
export function collectImportGraph(code: string, documentPath: string): ImportGraph {
  const files: ImportedFile[] = [];
  const locations = new Map<string, string>();
  const failures = new Map<string, ImportFailure | undefined>();
  const documentDir = toRealPath(path.dirname(documentPath));

  const resolveImport = (statement: ImportStatement, importer?: LocatedFile): ImportResolution => {
    const importPath = statement.path;
    const fail = (message: string): ImportFailure => ({ importer: importer?.logicalPath, statement, message });

    if (importPath.startsWith('/')) {
      const message = `Absolute import paths are not supported, use a relative path or a package import instead of '${importPath}'`;
      return { failure: fail(message) };
    }

    const logicalPath = resolveLogicalPath(importer?.logicalPath, importPath);
    const location = locateImport(importer ? path.dirname(importer.location) : documentDir, importPath);
    if (location === undefined) {
      const message = `Could not find imported file '${importPath}' in any node_modules directory`;
      return { logicalPath, failure: fail(message) };
    }

    // A logical path must always refer to the same file, which is not the case when different
    // copies of a package are imported (e.g. nested in node_modules)
    const knownLocation = locations.get(logicalPath);
    if (knownLocation !== undefined && knownLocation !== location) {
      const message =
        `Imported file '${importPath}' resolves to '${location}', but '${logicalPath}' was already imported ` +
        `from '${knownLocation}'. Importing multiple copies of a package is not supported`;
      return { logicalPath, failure: fail(message) };
    }
    if (knownLocation !== undefined) return { logicalPath, failure: failures.get(logicalPath) };
    if (files.length >= MAX_IMPORTED_FILES) return { logicalPath };
    locations.set(logicalPath, location);

    const content = readFile(location);
    if (content === undefined) return { logicalPath };
    files.push({ logicalPath, content });

    // Imports inside the imported file are resolved relative to that file, both on disk and in
    // the logical (compiler-facing) path space
    const file: LocatedFile = { logicalPath, location };
    const nestedFailures = parseImportStatements(content).map((nested) => resolveImport(nested, file).failure);
    const failure = nestedFailures.find((nestedFailure) => nestedFailure !== undefined);
    failures.set(logicalPath, failure);

    return { logicalPath, failure };
  };

  const documentImports = parseImportStatements(code).map((statement) => ({ statement, ...resolveImport(statement) }));
  return { documentImports, files };
}

// Mirrors cashc's disk resolver: imports are resolved from the importing file's real (symlink-resolved)
// location like Node.js does, so a package's own dependencies are found where the package is installed
// (e.g. next to it in node_modules/.pnpm/<package>@<version>/node_modules when installed with pnpm)
function locateImport(fromDir: string, importPath: string): string | undefined {
  const filePath = isPackageImport(importPath)
    ? resolveFromNodeModules(fromDir, importPath)
    : path.resolve(fromDir, importPath);

  return filePath === undefined ? undefined : toRealPath(filePath);
}

// Missing files keep their lexical path, so they are reported when they cannot be read
function toRealPath(filePath: string): string {
  try {
    return fs.realpathSync(filePath);
  } catch {
    return filePath;
  }
}

// Mirrors cashc: walk up from the importing file's directory looking for node_modules/<importPath>,
// so contract libraries installed as npm packages resolve like Node.js modules do
function resolveFromNodeModules(fromDir: string, importPath: string): string | undefined {
  let currentDir = path.resolve(fromDir);

  for (;;) {
    const nodeModulesDir = path.join(currentDir, 'node_modules');
    const candidate = path.join(nodeModulesDir, importPath);

    // The prefix check stops '..' segments in an import path from escaping node_modules
    if (candidate.startsWith(nodeModulesDir + path.sep) && isFile(candidate)) return candidate;

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) return undefined;
    currentDir = parentDir;
  }
}

function isFile(filePath: string): boolean {
  return fs.statSync(filePath, { throwIfNoEntry: false })?.isFile() ?? false;
}

function readFile(filePath: string): string | undefined {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return undefined;
  }
}
