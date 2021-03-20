/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import * as vscode from 'vscode';
import { workspace, ExtensionContext } from 'vscode';
import {compileFile} from 'cashc';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

const fs = require('fs');

let client: LanguageClient;

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
			const artifactJSON = JSON.stringify(compileFile(filename), null, 2);
			filename = filename.split('.').slice(0, -1).join('.') + ".json"
			fs.writeFile(filename, artifactJSON, (err) => {
				if(err){
					throw err
				}
			})
			console.log(`Compiled contact to ${filename}`);
		}
		context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
	}

	registerCompileCommand();

	/*
	const command = 'cashscript.sayHello';
	const commandHandler = (name:string = 'world') => {
		var filename = vscode.window.activeTextEditor.document.fileName;
		const artifactJSON = JSON.stringify(compileFile(filename), null, 2);
		filename = filename.split('.').slice(0, -1).join('.') + ".json"
		console.log(filename);
		fs.writeFile(filename, artifactJSON, (err) => {
			if(err){
				throw err
			}
		})

		console.log(`Hello ${name}!!!`);
	};
	context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
	*/




	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
