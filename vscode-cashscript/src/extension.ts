import * as path from 'path';
import * as vscode from 'vscode';
import { ExtensionContext, workspace } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import CashscriptHoverProvider from './CashscriptHoverProvider';

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

    // Subscribe to events here

    vscode.languages.registerHoverProvider('cashscript', new CashscriptHoverProvider())


    client.start();
}

export function deactivate(): Thenable<void> | undefined {
    if(!client){
        return undefined;
    }
    return client.stop();
}