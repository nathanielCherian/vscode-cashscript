import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { ExtensionContext, workspace } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import CashscriptHoverProvider from './CashscriptHoverProvider';
import CashscriptSignatureCompleter from './CashscriptSignatureCompleter';
import CashscriptCompletionProvider from './CashscriptCompletionProvider';
import { compileFile } from 'cashc';
import {
	asmToScript,
	calculateBytesize,
	countOpcodes,
  } from '@cashscript/utils';

let client: LanguageClient;

export function activate(context: ExtensionContext){


    // Initialize Server Options
    const serverModule = path.join(__dirname, 'server.js');
    let serverOptions: ServerOptions = {
        debug:{
            module:serverModule,
            options:{
                execArgv: ['--nolazy', '--inspect=6069']
            },
            transport:TransportKind.ipc
        },
        run:{
            module:serverModule,
            transport: TransportKind.ipc
        }
    }

    // Initialize Client Options
    let clientOptions: LanguageClientOptions = {
        documentSelector: [
            {scheme:'file', language:'cashscript'}
        ],
        synchronize: {
            fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
        },
        initializationOptions: context.extensionPath,
    };


    client = new LanguageClient(
        'cashscript',
        'Cashscript Language Server',
        serverOptions,
        clientOptions
    )

    
    // Subscribe to Commands here
    context.subscriptions.push(vscode.commands.registerCommand('cashscript.compile', () => {
        var filename = vscode.window.activeTextEditor.document.fileName;
        if(!filename.endsWith('.cash')) return; // force filename to end with .cash
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
            vscode.window.showInformationMessage(`Compiled contract to artifact '${path.basename(filename)}'`);
            console.log(`Compiled contact to ${filename}`);
        }catch(e){
            vscode.window.showErrorMessage(`Unable to compile '${path.basename(filename)}', ` + e);
        }
    }));


    // Subscribe to events here
    vscode.languages.registerHoverProvider('cashscript', new CashscriptHoverProvider())
	vscode.languages.registerSignatureHelpProvider('cashscript', new CashscriptSignatureCompleter(), '(');
    vscode.languages.registerCompletionItemProvider('cashscript', new CashscriptCompletionProvider(), '.');

    client.start();
}

export function deactivate(): Thenable<void> | undefined {
    if(!client){
        return undefined;
    }
    return client.stop();
}