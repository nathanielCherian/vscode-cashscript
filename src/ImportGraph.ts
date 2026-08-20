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
   * The key cashc's in-memory resolver uses for this file: the verbatim import path for files
   * resolved from node_modules, and a normalised POSIX path relative to the document for the rest
   */
  canonicalPath: string;
  content: string;
  /** Whether the file itself was reached through a package (node_modules) import */
  isPackageImport: boolean;
}

/** The (transitive) import graph of a document, read from disk */
export interface ImportGraph {
  files: ImportedFile[];
  /** Import paths that could not be found in any node_modules directory */
  unresolvedPackageImports: Set<string>;
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

export function parseImportPaths(code: string): string[] {
  return parseImportStatements(code).map((statement) => statement.path);
}

// Mirrors cashc: an import path that is not explicitly relative or absolute refers to a file
// inside an npm package, and is resolved from node_modules (CashScript 0.14+)
export function isPackageImport(importPath: string): boolean {
  return !importPath.startsWith('./') && !importPath.startsWith('../') && !importPath.startsWith('/');
}

/**
 * Mirrors cashc's in-memory resolver: package imports are looked up verbatim regardless of the
 * importing file, while other imports are normalised POSIX paths relative to the importing file.
 */
export function canonicaliseImportPath(fromCanonicalDir: string, importPath: string): string {
  if (isPackageImport(importPath)) return path.posix.normalize(importPath);
  return path.posix.normalize(path.posix.join(fromCanonicalDir, importPath));
}

// The directories an import is resolved against: `diskDir` locates the file on disk, while
// `canonicalDir` produces the key that the compiler's in-memory resolver will look it up by
interface ImportOrigin {
  diskDir: string;
  canonicalDir: string;
}

/**
 * Reads the document's (transitive) import graph from disk. Files that cannot be read are left
 * out, so the compiler reports them on the import directive itself.
 */
export function collectImportGraph(code: string, documentPath: string): ImportGraph {
  const files: ImportedFile[] = [];
  const unresolvedPackageImports = new Set<string>();
  const visited = new Set<string>();

  const documentOrigin: ImportOrigin = { diskDir: path.dirname(documentPath), canonicalDir: '.' };
  const queue = parseImportPaths(code).map((importPath) => ({ importPath, origin: documentOrigin }));

  while (queue.length > 0 && files.length < MAX_IMPORTED_FILES) {
    const entry = queue.shift();
    if (entry === undefined) break;

    const { importPath, origin } = entry;
    const canonicalPath = canonicaliseImportPath(origin.canonicalDir, importPath);
    if (visited.has(canonicalPath)) continue;
    visited.add(canonicalPath);

    const diskPath = resolveImportOnDisk(importPath, origin);
    if (diskPath === undefined) {
      unresolvedPackageImports.add(importPath);
      continue;
    }

    const content = readFile(diskPath);
    if (content === undefined) continue;

    files.push({ canonicalPath, content, isPackageImport: isPackageImport(importPath) });

    // Imports inside the imported file are resolved relative to that file, both on disk and in
    // the canonical (compiler-facing) path space
    const nestedOrigin: ImportOrigin = {
      diskDir: path.dirname(diskPath),
      canonicalDir: path.posix.dirname(canonicalPath),
    };
    for (const nestedPath of parseImportPaths(content)) {
      queue.push({ importPath: nestedPath, origin: nestedOrigin });
    }
  }

  return { files, unresolvedPackageImports };
}

function resolveImportOnDisk(importPath: string, origin: ImportOrigin): string | undefined {
  if (!isPackageImport(importPath)) return path.resolve(origin.diskDir, importPath);
  return resolveFromNodeModules(origin.diskDir, importPath);
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
