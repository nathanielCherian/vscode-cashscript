import * as path from 'path';
import * as vscode from 'vscode';
import { ExtensionContext, workspace } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: ExtensionContext){


    // Initialize Server
    const serverModule = path.join(__dirname, 'server.js');
    let serverOptions: ServerOptions = {
        RUN:{MODULE}
    }

    // Initialize Client
    let clientOptions: LanguageClientOptions = {
        documentSelector: [{scheme:'file', language:'cashscript'}],
        synchronize: {
            fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
        }
    }

    client.start();
}

export function deactivate(): Thenable<void> | undefined {
    if(!client){
        return undefined;
    }
    return client.stop();
}