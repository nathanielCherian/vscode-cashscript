import * as vscode from 'vscode';

export default class SignatureCompleter implements vscode.SignatureHelpProvider{
	provideSignatureHelp(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.SignatureHelpContext): vscode.ProviderResult<vscode.SignatureHelp> {
		
		const outputChannel = vscode.window.createOutputChannel('VSCODE-CASHSCRIPT DEBUG')
		outputChannel.appendLine(document.getText(document.getWordRangeAtPosition(position)));
		outputChannel.show();

		const sh = new vscode.SignatureHelp();
		sh.signatures = [new vscode.SignatureInformation("param here", "documentation here")]
		return sh;
	}

}