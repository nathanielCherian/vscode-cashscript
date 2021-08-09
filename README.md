# vscode-cashscript

[![Version](https://vsmarketplacebadge.apphb.com/version/nathanielcherian.cashscript.svg)](https://marketplace.visualstudio.com/items?itemName=nathanielcherian.cashscript)  [![Downloads](https://vsmarketplacebadge.apphb.com/downloads/nathanielcherian.cashscript.svg)](https://marketplace.visualstudio.com/items?itemName=nathanielcherian.cashscript) [![Installs](https://vsmarketplacebadge.apphb.com/installs/nathanielcherian.cashscript.svg)](https://marketplace.visualstudio.com/items?itemName=nathanielcherian.cashscript) [![Rating](https://vsmarketplacebadge.apphb.com/rating-star/nathanielcherian.cashscript.svg)](https://marketplace.visualstudio.com/items?itemName=nathanielcherian.cashscript#review-details)

Vscode-cashscript provides tools that make it easier for developers to write smart contracts with [cashscript](https://cashscript.org/).

![example of vscode-cashscript](https://raw.githubusercontent.com/nathanielCherian/vscode-cashscript/main/media/p2pkh.gif)

A special thank you to [vscode-solidity](https://github.com/juanfranblanco/vscode-solidity) which inspired much of the code structure!

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

### 0.1.2
- Added tx to completion provider and syntax highlighting
- added byte alias for bytes1
