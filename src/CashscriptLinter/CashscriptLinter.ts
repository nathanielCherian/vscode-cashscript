import { Diagnostic, DiagnosticSeverity, DiagnosticTag, Range } from 'vscode-languageserver';
import { SafeErrorListener } from './ErrorListeners';
import type { CashScriptError, CashScriptWarning, Point } from 'cashc';
import { gtr, intersects, ltr, satisfies } from 'semver';
import {
  collectImportGraph,
  DocumentImport,
  ImportStatement,
  parseImportStatements,
  SourceRange,
} from '../ImportGraph';
import { blankOutComments } from '../utils';

type CashcModule = Pick<typeof import('cashc'), 'compileString'>;
type CompileString = CashcModule['compileString'];
type CashscriptCompilerVersion = '0.12' | '0.13' | '0.14';
type SourcePoint = Pick<Point, 'line' | 'column'>;
type SourceLocation = { start: SourcePoint; end: SourcePoint };

// Literal import() calls so the bundler includes each compiler version as a lazy chunk
const CASHC_IMPORTERS: Record<CashscriptCompilerVersion, () => Promise<CashcModule>> = {
  '0.12': () => import('cashc-012'),
  '0.13': () => import('cashc-013'),
  '0.14': () => import('cashc'),
};

const CASHC_VERSIONS: Record<CashscriptCompilerVersion, string> = {
  '0.12': '0.12.2',
  '0.13': '0.13.3',
  '0.14': '0.14.0',
};
const LATEST_COMPILER_VERSION: CashscriptCompilerVersion = '0.14';
// Versions that predate import directives; newer versions take the full linting path
const PRE_IMPORT_COMPILER_VERSIONS: CashscriptCompilerVersion[] = ['0.12', '0.13'];
const SEMVER_OPTIONS = { includePrerelease: true, loose: true };

// Warnings about code that has no effect, which editors render faded (CashScript 0.14+)
const UNNECESSARY_CODE_WARNINGS = ['UnusedVariableWarning', 'UnusedAssignmentWarning'];

const cashcModules: Partial<Record<CashscriptCompilerVersion, Promise<CashcModule>>> = {};

function loadCashc(compilerVersion: CashscriptCompilerVersion): Promise<CashcModule> {
  cashcModules[compilerVersion] ??= CASHC_IMPORTERS[compilerVersion]();
  return cashcModules[compilerVersion];
}

export default class CashscriptLinter {
  /**
   * Compiles the document and converts compilation errors and warnings to diagnostics. Imports
   * are resolved from disk relative to `documentPath` (undefined for unsaved documents).
   */
  static async getDiagnostics(code: string, documentPath?: string): Promise<Diagnostic[]> {
    const compilerVersion = getCompilerVersion(code);
    const { compileString } = await loadCashc(compilerVersion);

    // Pre-import compilers lint the document verbatim, so a stray `import` is reported
    // as a parse error rather than as a misleading error from inside the imported file
    if (PRE_IMPORT_COMPILER_VERSIONS.includes(compilerVersion)) {
      return compileAndCollectDiagnostics(compileString, code);
    }

    const imports = prefetchImportedFiles(code, documentPath);

    // Errors in imported files carry that file's line numbers, so imports are linted
    // separately (reported on their directive) before the main document compiles
    const importDiagnostics = validateImports(imports, compileString);
    if (importDiagnostics.length > 0) return importDiagnostics;

    return compileAndCollectDiagnostics(compileString, code, imports.files);
  }
}

function compileAndCollectDiagnostics(
  compileString: CompileString,
  code: string,
  files?: Record<string, string>,
): Diagnostic[] {
  const compilation = compileDocument(compileString, code, files);
  const ownWarnings = withoutImportedWarnings(compilation.warnings, compileString, code, files);

  const warningDiagnostics = ownWarnings.map((warning) => diagnosticFromWarning(warning, compilation.lintCode));

  return [...compilation.errors, ...warningDiagnostics].map((diagnostic) =>
    clampDiagnosticToCode(diagnostic, compilation.stubLine, code),
  );
}

interface Compilation {
  /** Located in `lintCode`, or in an imported file for errors inside imported files */
  errors: Diagnostic[];
  warnings: CashScriptWarning[];
  lintCode: string;
  stubLine?: number;
}

function compileDocument(compileString: CompileString, code: string, files?: Record<string, string>): Compilation {
  const errorListener = new SafeErrorListener();
  const warnings: CashScriptWarning[] = [];
  const warningListener = (warning: CashScriptWarning): void => {
    warnings.push(warning);
  };
  const { lintCode, stubLine } = files ? appendContractStubIfNeeded(code) : { lintCode: code, stubLine: undefined };

  let thrownErrors: Diagnostic[] = [];
  try {
    compileString(lintCode, { errorListener, warningListener, files });
  } catch (error) {
    if (errorListener.getErrs().length === 0) {
      thrownErrors = [diagnosticFromCompilerError(error)];
    }
  }

  const errors = [...errorListener.getErrs(), ...thrownErrors];

  return { errors, warnings, lintCode, stubLine };
}

/**
 * Removes the warnings that belong to imported files. The compiler reports those with the
 * imported file's line numbers and no file name, so they are identified by compiling the
 * document's import directives on their own (the same import graph without the document's
 * own code) and removing the warnings that produces from the document's.
 */
function withoutImportedWarnings(
  warnings: CashScriptWarning[],
  compileString: CompileString,
  code: string,
  files?: Record<string, string>,
): CashScriptWarning[] {
  if (files === undefined || warnings.length === 0) return warnings;

  const importStatements = parseImportStatements(code);
  if (importStatements.length === 0) return warnings;

  const importedWarnings = compileDocument(compileString, importsOnlyCode(importStatements), files).warnings;

  // Multiset difference, so a warning the document raises on top of an identical imported
  // one is still reported
  const importedCounts = new Map<string, number>();
  for (const warning of importedWarnings) {
    const key = warningKey(warning);
    importedCounts.set(key, (importedCounts.get(key) ?? 0) + 1);
  }

  return warnings.filter((warning) => {
    const key = warningKey(warning);
    const importedCount = importedCounts.get(key) ?? 0;
    if (importedCount === 0) return true;
    importedCounts.set(key, importedCount - 1);
    return false;
  });
}

// The message includes the warning's location, so equal keys mean the same warning
function warningKey(warning: CashScriptWarning): string {
  return `${warning.name}: ${warning.message}`;
}

// A document with only these import directives compiles the same (part of the) import graph
// from the same `files` as the document itself, without any of the document's own code
function importsOnlyCode(importStatements: ImportStatement[]): string {
  return importStatements.map((statement) => `import "${statement.path}";`).join('\n');
}

// Appended to "library" files (top-level definitions without a contract) so semantic
// analysis runs instead of aborting with MissingContractError; unused globals don't warn
const CONTRACT_STUB = 'contract CashscriptLinterStub() { function stub() { require(true); } }';

const TYPE_NAME_PATTERN = 'int|bool|string|pubkey|sig|datasig|byte|bytes\\d*';

function appendContractStubIfNeeded(code: string): { lintCode: string; stubLine?: number } {
  const codeWithoutComments = blankOutComments(code);
  const hasContract = /^\s*contract\b/m.test(codeWithoutComments);
  const hasTopLevelDefinitions =
    /^\s*(function|import)\b/m.test(codeWithoutComments) ||
    new RegExp(`^\\s*(${TYPE_NAME_PATTERN})\\s+constant\\b`, 'm').test(codeWithoutComments);
  if (hasContract || !hasTopLevelDefinitions) return { lintCode: code };

  return { lintCode: `${code}\n${CONTRACT_STUB}`, stubLine: code.split('\n').length };
}

// Remaps diagnostics that point into the appended stub onto the document's last line
function clampDiagnosticToCode(diagnostic: Diagnostic, stubLine: number | undefined, code: string): Diagnostic {
  if (stubLine === undefined || diagnostic.range.start.line < stubLine) return diagnostic;

  const lines = code.split('\n');
  let lastLine = lines.length - 1;
  while (lastLine > 0 && lines[lastLine].trim() === '') lastLine -= 1;

  const range: Range = {
    start: { line: lastLine, character: 0 },
    end: { line: lastLine, character: lines[lastLine].length },
  };

  // An error on the (invisible) stub's 'contract' token means the document is incomplete
  const message = diagnostic.message.includes("'contract'") ? 'Unexpected end of file' : diagnostic.message;

  return { ...diagnostic, range, message };
}

/** The document's imported sources, prepared for cashc's in-memory `files` option */
interface PrefetchedImports {
  /** The document's own import directives, and how they resolved */
  documentImports: DocumentImport[];
  /** Imported sources, keyed by the logical path that cashc's in-memory resolver looks them up by */
  files: Record<string, string>;
}

const NO_IMPORTS: PrefetchedImports = { documentImports: [], files: {} };

/**
 * Reads the document's import graph from disk, keyed by logical path for cashc's `files`
 * option. Unreadable files are left out so the compiler reports them in place.
 */
function prefetchImportedFiles(code: string, documentPath?: string): PrefetchedImports {
  if (documentPath === undefined) return NO_IMPORTS;

  const { documentImports, files } = collectImportGraph(code, documentPath);

  return {
    documentImports,
    files: Object.fromEntries(files.map((file) => [file.logicalPath, file.content])),
  };
}

/**
 * Lints each of the document's imports, reporting its first error as a diagnostic on the
 * import directive: a directive that cashc rejects while resolving imports from disk (which the
 * compiler cannot report, as it only sees the files that were read), or else the first compile
 * error in the imported files. Warnings inside imported files are only shown when that file
 * itself is open.
 */
function validateImports(imports: PrefetchedImports, compileString: CompileString): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const { statement, logicalPath, failure } of imports.documentImports) {
    if (failure !== undefined) {
      const message =
        failure.importer === undefined
          ? failure.message
          : importedFileErrorMessage(statement, failure.statement.range.start, failure.message);
      diagnostics.push(Diagnostic.create(statement.range, message, DiagnosticSeverity.Error));
      continue;
    }

    // Unreadable imports are reported (with the right location) by the main compile
    if (logicalPath === undefined || imports.files[logicalPath] === undefined) continue;

    // The directive is compiled on its own, so the compiler resolves the imported file (and
    // detects cycles) exactly like it does for the document
    const [firstError] = compileDocument(compileString, importsOnlyCode([statement]), imports.files).errors;
    if (!firstError) continue;

    const message = importedFileErrorMessage(statement, firstError.range.start, firstError.message);
    diagnostics.push(Diagnostic.create(statement.range, message, DiagnosticSeverity.Error));
  }

  return diagnostics;
}

// Errors inside imported files are located in the file they occur in (which may be imported by
// the directly imported file), while the compiler does not say which file that is
function importedFileErrorMessage(statement: ImportStatement, position: SourceRange['start'], message: string): string {
  return (
    `Imported file '${statement.path}' contains an error at ` +
    `Line ${position.line + 1}, Column ${position.character}: ${message}`
  );
}

function getCompilerVersion(code: string): CashscriptCompilerVersion {
  const pragmaRange = code.match(/^\s*pragma\s+cashscript\s+([^;]+);/m)?.[1]?.trim();
  if (!pragmaRange) return LATEST_COMPILER_VERSION;

  if (supportsPragmaRange('0.14', pragmaRange)) return '0.14';
  if (supportsPragmaRange('0.13', pragmaRange)) return '0.13';
  if (supportsPragmaRange('0.12', pragmaRange)) return '0.12';

  try {
    if (intersects(pragmaRange, '>=0.14.0 <0.15.0', SEMVER_OPTIONS) || ltr('0.14.0', pragmaRange, SEMVER_OPTIONS)) {
      return '0.14';
    }

    if (intersects(pragmaRange, '>=0.13.0 <0.14.0', SEMVER_OPTIONS)) {
      return '0.13';
    }

    if (intersects(pragmaRange, '>=0.12.0 <0.13.0', SEMVER_OPTIONS) || gtr('0.12.0', pragmaRange, SEMVER_OPTIONS)) {
      return '0.12';
    }
  } catch {
    // Let the latest compiler report malformed pragma ranges.
  }

  return LATEST_COMPILER_VERSION;
}

function supportsPragmaRange(compilerVersion: CashscriptCompilerVersion, pragmaRange: string): boolean {
  try {
    return satisfies(CASHC_VERSIONS[compilerVersion], pragmaRange, SEMVER_OPTIONS);
  } catch {
    return false;
  }
}

function diagnosticFromCompilerError(error: unknown): Diagnostic {
  const originalMessage = error instanceof Error ? error.message : String(error);
  const location = (error as Partial<CashScriptError> | null | undefined)?.node?.location;
  const range = rangeFromLocation(location, originalMessage);

  return Diagnostic.create(range, withoutLocationSuffix(originalMessage), DiagnosticSeverity.Error);
}

function diagnosticFromWarning(warning: CashScriptWarning, code: string): Diagnostic {
  const fullRange = rangeFromLocation(warning.node?.location, warning.message);

  // The location of an unused variable spans its whole declaration (or, for a tuple target,
  // the whole tuple assignment), so narrow the range down to the variable name itself
  const name = (warning.node as { name?: unknown } | undefined)?.name;
  const range = (typeof name === 'string' && narrowRangeToWord(code, fullRange, name)) || fullRange;

  const diagnostic = Diagnostic.create(range, withoutLocationSuffix(warning.message), DiagnosticSeverity.Warning);
  diagnostic.code = warning.name;
  if (UNNECESSARY_CODE_WARNINGS.includes(warning.name)) diagnostic.tags = [DiagnosticTag.Unnecessary];

  return diagnostic;
}

// Narrows a range to the first whole-word occurrence of `word` inside it
function narrowRangeToWord(code: string, range: Range, word: string): Range | undefined {
  if (!/^\w+$/.test(word)) return undefined;

  const lines = code.split('\n').slice(range.start.line, range.end.line + 1);
  if (lines.length === 0) return undefined;
  lines[lines.length - 1] = lines[lines.length - 1].slice(0, range.end.character);
  lines[0] = lines[0].slice(range.start.character);

  const text = lines.join('\n');
  const match = new RegExp(`\\b${word}\\b`).exec(text);
  if (!match) return undefined;

  const linesBefore = text.slice(0, match.index).split('\n');
  const line = range.start.line + linesBefore.length - 1;
  const lineStart = linesBefore.length === 1 ? range.start.character : 0;
  const character = lineStart + linesBefore[linesBefore.length - 1].length;

  return { start: { line, character }, end: { line, character: character + word.length } };
}

// Compiler errors and warnings carry the node's location, falling back to the
// "at Line X, Column Y" suffix of the message for nodes without one
function rangeFromLocation(location: SourceLocation | undefined, originalMessage: string): Range {
  const messageLocation = originalMessage.match(/\bat Line (\d+), Column (\d+)$/);
  const fallbackPoint = messageLocation
    ? { line: Number(messageLocation[1]), column: Number(messageLocation[2]) }
    : { line: 1, column: 0 };

  return {
    start: pointToPosition(location?.start ?? fallbackPoint),
    end: pointToPosition(location?.end ?? fallbackPoint),
  };
}

function pointToPosition(point: SourcePoint): Range['start'] {
  return {
    line: Math.max(point.line - 1, 0),
    character: Math.max(point.column, 0),
  };
}

function withoutLocationSuffix(message: string): string {
  return message.replace(/\s+at Line \d+, Column \d+$/, '');
}
