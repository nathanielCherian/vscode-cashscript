# Change Log

All notable changes to the "vscode-cashscript" extension will be documented in this file.

## 0.1.0
Initial release of vscode-cashscript. Features:
- Syntax Highlighting
- Auto-Completion
- Snippets
- Linting
- Contract Compilation (press F5 or click "Compile Contract")
Would like to implement tests and other sustainability features before bumping version

## 0.1.1
- Fixed language grammar to have comprehensive highlighting
- Added janky HoverProvider for variable types
- Added split/reverse to hover provider

## 0.1.2
- Added tx to completion provider and syntax highlighting
- added byte alias for bytes1

## 0.2.0
- Compatible with ```cashscript@0.7.0```
    - Updated to new Native Introspection functionality
    - Added tuple destructuring
    - Added new ```constant``` keyword
    - Added ```*``` operator
    