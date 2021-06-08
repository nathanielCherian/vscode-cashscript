import {
    createConnection,
    InitializeParams,
    InitializeResult,
    ProposedFeatures,
    TextDocuments
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument';
import CashscriptLinter from './CashscriptLinter/CashscriptLinter';

let connection = createConnection(ProposedFeatures.all);
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let isValidatingFile = false; // stop excessive checks for performace
let validationDelay = 750 // Delay in ms for checking file


// Initialize connection
connection.onInitialize((params: InitializeParams) => {
    let capabilities = params.capabilities;

    const result: InitializeResult = {
        capabilities: {
            
        }
    }

    return result;
});


/**
 * On document change
 *  - validate
 */
documents.onDidChangeContent(change => {
    if(!isValidatingFile){
        isValidatingFile = true;
        setTimeout(() => validateDocument(change.document), validationDelay)
    }
});


/**
 * Reports diagnostics to language client
 * 
 * @param textDocument vscode-languageserver textDocument
 */
async function validateDocument(textDocument:TextDocument): Promise<void> {
    const code = textDocument.getText();
    const diagnostics = CashscriptLinter.getDiagnostics(code);
    connection.sendDiagnostics({
        uri:textDocument.uri,
        diagnostics
    });
    isValidatingFile = false;
}



// Register Connection
documents.listen(connection);
connection.listen();