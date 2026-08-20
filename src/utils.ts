import { fileURLToPath } from 'url';
// Must stay a type-only import: this module is also loaded by the language server
// process, where the vscode module does not exist at runtime
import type { TextDocument } from 'vscode';

// Returns the document's filesystem path; undefined for non-file (e.g. untitled) documents
export function documentFilePath(document: TextDocument): string | undefined {
  return document.uri.scheme === 'file' ? document.uri.fsPath : undefined;
}

// Converts a document URI to a filesystem path; undefined for non-file documents
export function uriToFilePath(uri: string): string | undefined {
  if (!uri.startsWith('file:')) return undefined;

  try {
    return fileURLToPath(uri);
  } catch {
    return undefined;
  }
}

// Blanks out comment contents (newlines preserved) so offsets stay aligned
export function blankOutComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (m) => m.replace(/[^\n]/g, ' '));
}

// Blanks out string contents (even unterminated ones still being typed), e.g. so
// braces and parens inside strings don't affect cursor-context classification
export function blankOutStrings(text: string): string {
  return text.replace(/(["'])(?:\\.|(?!\1)[^\n\\])*(\1|$)/gm, (m) => m.replace(/[^\n]/g, ' '));
}

// Removes comments and flattens a multiline signature into a single line
export function stripCommentsAndFlatten(input: string): string {
  return input
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}
