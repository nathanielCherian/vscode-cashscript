import { collectImportGraph } from './ImportGraph';
import { blankOutComments } from './utils';

/** A reusable function declared at the top level of a file (CashScript 0.14+) */
export interface UserFunction {
  name: string;
  /** Flattened signature without the body, e.g. `function double(int a) returns (int)` */
  signature: string;
  /** Parameter declarations, e.g. `['int a', 'int b']` */
  parameters: string[];
  /** Declared return types, e.g. `['int']` — empty for void functions */
  returnTypes: string[];
  /** The imported file's path, when defined in an imported file */
  importedFrom?: string;
}

/** A global constant declared at the top level of a file (CashScript 0.14+) */
export interface GlobalConstant {
  name: string;
  type: string;
  /** Flattened declaration, e.g. `int constant MAX_ATTEMPTS = 3` */
  declaration: string;
  /** The imported file's path, when defined in an imported file */
  importedFrom?: string;
}

/** The user-defined symbols (functions and constants) available in a document */
export interface UserSymbols {
  functions: UserFunction[];
  constants: GlobalConstant[];
}

const FUNCTION_DEF_REGEX = /\bfunction\s+([A-Za-z]\w*)\s*\(([^)]*)\)\s*(?:returns\s*\(([^)]*)\))?/g;
const CONSTANT_DEF_REGEX =
  /\b(int|bool|string|pubkey|sig|datasig|byte|bytes\d*)\s+constant\s+([A-Za-z]\w*)\s*=\s*([^;]*);/g;

/**
 * Collects the document's top-level functions and global constants, including those in
 * (transitively) imported files, which are read from disk relative to the document — or from
 * node_modules for package imports.
 */
export function collectUserSymbols(code: string, documentPath?: string): UserSymbols {
  const symbols = collectFromSource(code);

  if (documentPath === undefined) return symbols;

  for (const file of collectImportGraph(code, documentPath).files) {
    const imported = collectFromSource(file.content);
    symbols.functions.push(...imported.functions.map((f) => ({ ...f, importedFrom: file.canonicalPath })));
    symbols.constants.push(...imported.constants.map((c) => ({ ...c, importedFrom: file.canonicalPath })));
  }

  return symbols;
}

export function collectUserFunctions(code: string, documentPath?: string): UserFunction[] {
  return collectUserSymbols(code, documentPath).functions;
}

export function findUserFunction(code: string, name: string, documentPath?: string): UserFunction | undefined {
  return collectUserFunctions(code, documentPath).find((userFunction) => userFunction.name === name);
}

export function findGlobalConstant(code: string, name: string, documentPath?: string): GlobalConstant | undefined {
  return collectUserSymbols(code, documentPath).constants.find((constant) => constant.name === name);
}

// Extracts top-level definitions from one source text; anything inside a contract
// block (brace depth > 0) is a spending path or local, not a user-defined symbol
function collectFromSource(code: string): UserSymbols {
  const codeWithoutComments = blankOutComments(code);
  const functions: UserFunction[] = [];
  const constants: GlobalConstant[] = [];

  for (const match of codeWithoutComments.matchAll(FUNCTION_DEF_REGEX)) {
    if (braceDepthAt(codeWithoutComments, match.index) > 0) continue;

    const [, name, rawParameters, rawReturns] = match;
    const parameters = rawParameters
      .split(',')
      .map((parameter) => parameter.replace(/\s+/g, ' ').trim())
      .filter((parameter) => parameter !== '');

    const returnTypes = (rawReturns ?? '')
      .split(',')
      .map((returnType) => returnType.replace(/\s+/g, ' ').trim())
      .filter((returnType) => returnType !== '');

    const returnsClause = rawReturns !== undefined ? ` returns (${returnTypes.join(', ')})` : '';
    const signature = `function ${name}(${parameters.join(', ')})${returnsClause}`;

    functions.push({ name, signature, parameters, returnTypes });
  }

  for (const match of codeWithoutComments.matchAll(CONSTANT_DEF_REGEX)) {
    if (braceDepthAt(codeWithoutComments, match.index) > 0) continue;

    const [, type, name, rawValue] = match;
    const value = rawValue.replace(/\s+/g, ' ').trim();
    constants.push({ name, type, declaration: `${type} constant ${name} = ${value}` });
  }

  return { functions, constants };
}

function braceDepthAt(text: string, index: number): number {
  let depth = 0;
  for (let i = 0; i < index; i++) {
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}') depth -= 1;
  }
  return depth;
}
