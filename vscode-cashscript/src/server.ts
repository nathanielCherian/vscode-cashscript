import {
    createConnection,
    ProposedFeatures,
    TextDocuments
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument';

let connection = createConnection(ProposedFeatures.all);
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// Connection stuff here



// Register Connection
documents.listen(connection);
connection.listen();