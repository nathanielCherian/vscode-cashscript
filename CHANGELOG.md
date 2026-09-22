# Change Log

All notable changes to the "vscode-cashscript" extension will be documented in this file.

## v0.10.0

- Show compiler warnings as warning diagnostics: unused variables that are not marked `unused` and values assigned to a variable that are never read afterwards.
- Add the `constant` and `unused` modifiers on tuple destructuring targets (`bytes unused head, bytes tail = x.split(1);`).
- Update underlying compiler versions.

## v0.9.0

- Add package imports: an import path that does not start with `./`, `../` or `/` is resolved from `node_modules`, walking up parent directories like Node.js does. Completions, hovers and signature help include functions and constants from imported packages.
- Add tuple destructuring into existing variables (`(a, b) = swap(a, b);`).

## v0.8.1

- Fix the extension failing to start
- Fix diagnostics not appearing for all files when multiple files were opened or edited in quick succession
- Clear diagnostics when a file is closed

## v0.8.0

- Add support for CashScript v0.14.0 (currently in pre-release on `@next`)
  - Add user-defined reusable functions, including multiple return values with destructuring
  - Add top-level global constants (completions & hover show the compile-time declaration)
  - Add the `unused` modifier for intentionally unused parameters and variables
  - Add `import` directives — imported files are resolved from disk relative to the document
  - Diagnostics for library files (functions / constants without a contract)
  - Errors inside imported files are reported on the corresponding `import` statement
  - Completions, hovers and signature help include functions and constants from (transitively) imported files
- Keep supporting 0.12 and 0.13 contracts based on the pragma version

## v0.7.0

- Improve diagnostics for compiler errors
- Support highlighting for both 0.12 and 0.13 depending on the pragma version

## v0.6.0

- Add support for CashScript v0.13.0
  - Add `do-while`, `while` and `for` loops (grammar, highlighting, snippets, completions)
  - Add `unsafe_int`, `unsafe_bool`, `unsafe_byte`, `unsafe_bytes` casts
  - Add `toPaddedBytes(int, int)` global function
  - Add `<<`, `>>` bitshift and `~` invert operators
  - Remove the two-argument `bytes(value, size)` padding cast (replaced by `toPaddedBytes`)

## v0.5.2

- Add support for CashScript v0.11.0
  - Add `slice` function
  - Rename `tx.age` property to `this.age`
  - Add some missing completions & highlighting
  - Fix hover information for contract and function signatures

## v0.5.0 & v0.5.1

These releases were published incorrectly. All changes that were meant to be in v0.5.0 are published in v0.5.2.

## v0.4.0

- Add support for CashScript v0.10.0
  - Add `console.log` statements
  - Add optional failure message to `require` statements
  - Add support for underscores in numbers and scientific notation

## v0.3.0

- Add support for CashScript v0.8.0
  - Add token properties to inputs and outputs
  - Remove 'OutputX' in favour of 'LockingBytecodeX'
- Remove 'Compilation' functionality due to ESM incompatibilties
- Small fixes and refactors
- Update examples

## 0.2.0

- Add support for CashScript v0.7.0
  - Updated to new Native Introspection functionality
  - Added tuple destructuring
  - Added new `constant` keyword
  - Added `*` operator

## 0.1.2

- Added tx to completion provider and syntax highlighting
- added byte alias for bytes1

## 0.1.1

- Fixed language grammar to have comprehensive highlighting
- Added janky HoverProvider for variable types
- Added split/reverse to hover provider

## 0.1.0

Initial release of vscode-cashscript. Features:

- Syntax Highlighting
- Auto-Completion
- Snippets
- Linting
- Contract Compilation (press F5 or click "Compile Contract")
  Would like to implement tests and other sustainability features before bumping version
