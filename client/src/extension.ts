/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import * as vscode from 'vscode';
import { workspace, ExtensionContext, HoverProvider } from 'vscode';
import {compileFile} from 'cashc';
import {
	asmToScript,
	calculateBytesize,
	countOpcodes,
	exportArtifact,
	scriptToAsm,
	scriptToBytecode,
  } from '@cashscript/utils';

import {
	LanguageClient,
	LanguageClientOptions,
	MarkedString,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

import SignatureCompleter from './SignatureCompleter';
import CashscriptHoverProvider from './CashscriptHoverProvider';

const fs = require('fs');

let client: LanguageClient;

//Debug channel
const outputChannel = vscode.window.createOutputChannel('VSCODE-CASHSCRIPT DEBUG')
outputChannel.appendLine("This is a test");
outputChannel.show();

export function activate(context: ExtensionContext) {
	// The server is implemented in node
	let serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);
	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'cashscript' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'languageServerExample',
		'Language Server Example',
		serverOptions,
		clientOptions
	);

	
	//Register command

	const registerCompileCommand = () => {
		const command = 'cashscript.compileContract';
		const commandHandler = () => {
			var filename = vscode.window.activeTextEditor.document.fileName;
			try{
				const artifact = compileFile(filename);
				const artifactJSON = JSON.stringify(artifact, null, 2);
				filename = filename.split('.').slice(0, -1).join('.') + ".json"
				
				fs.writeFile(filename, artifactJSON, (err) => {
					if(err){
						throw err
					}
				});

				const script = asmToScript(artifact.bytecode);
				const opcount = countOpcodes(script);
				const bytesize = calculateBytesize(script);

				if(opcount > 201){
					vscode.window.showWarningMessage('Warning: Your contract\'s opcount is over the limit of 201 and will not be accepted by the BCH network');
				}

				if(bytesize > 520){
					vscode.window.showWarningMessage('Warning: Your contract\'s bytesize is over the limit of 520 and will not be accepted by the BCH network');
				}

				vscode.window.showInformationMessage(`Compiled contract to artifact '${path.basename(filename)}'`); //  '${bytesize}' bytes`);
				console.log(`Compiled contact to ${filename}`);
			}catch(e){
				//vscode.window.showErrorMessage(""+e);
				vscode.window.showErrorMessage(`Unable to compile '${path.basename(filename)}', ` + e);
			}

		}
		
		context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
	}

	registerCompileCommand();


	vscode.languages.registerHoverProvider('cashscript', new CashscriptHoverProvider(outputChannel));	


	vscode.languages.registerSignatureHelpProvider('cashscript', new SignatureCompleter(), '(');

	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
