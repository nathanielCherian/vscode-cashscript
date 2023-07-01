# vscode-cashscript

![Visual Studio Marketplace Version (including pre-releases)](https://img.shields.io/visual-studio-marketplace/v/nathanielCherian.cashscript)
![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/nathanielcherian.cashscript)
![Visual Studio Marketplace Rating (Stars)](https://img.shields.io/visual-studio-marketplace/stars/nathanielCherian.cashscript)

Vscode-cashscript provides tools that make it easier for developers to write smart contracts with [cashscript](https://cashscript.org/).

![example of vscode-cashscript](https://raw.githubusercontent.com/nathanielCherian/vscode-cashscript/main/media/p2pkh.gif)

A special thank you to [vscode-solidity](https://github.com/juanfranblanco/vscode-solidity) which inspired much of the code structure!

## Features

- Syntax Highlighting
- Auto-Completion
- Snippets
- Linting

## Development Instructions

Press **F5** or click the "**Compile Contract**" button in the top right. A json file containing the contract artifiact will be created in the same directory with the same name.

Clone the project

```
git clone https://github.com/nathanielCherian/vscode-cashscript
```

Install Dependencies

```
cd vscode-cashscript && npm i
```

Open the project in vscode.

```
code .
```

Press F5 anywhere to start the test window, open the examples folder to test out any '.cash' file. All relevent files are located within the /src directory.

## Extension Settings

None available yet.

## Known Issues

None available yet.

## Release Notes

Check the [changelog](/CHANGELOG.md) for past releases. Latest stable version:

## 0.2.0
- Compatible with ```cashscript@0.7.0```
    - Updated to new Native Introspection functionality
    - Added tuple destructuring
    - Added new ```constant``` keyword
    - Added ```'*'``` operator
