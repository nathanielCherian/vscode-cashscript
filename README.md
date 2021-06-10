# vscode-cashscript

Vscode-cashscript provides tools that make it easier for developers to write smart contracts with [cashscript](https://cashscript.org/).

![example of vscode-cashscript](https://github.com/nathanielCherian/vscode-cashscript/blob/main/media/p2pkh.gif)

## Features

- Syntax Highlighting
- Auto-Completion
- Snippets
- Linting
- Contract Compilation

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

Open the project in vscode.=

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

### 1.0.0

Initial release of vscode-cashscript. Features:
- Syntax Highlighting
- Auto-Completion
- Snippets
- Linting
- Contract Compilation (press F5 or click "Compile Contract")
