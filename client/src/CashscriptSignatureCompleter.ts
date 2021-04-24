import * as vscode from 'vscode';

class CashscriptSignatureCompleter implements vscode.SignatureHelpProvider{

	SIG_DATA:{[key:string]:vscode.SignatureInformation[]} = {}
	re = /([a-zA-Z0-9]+)\(/g; // regex to get selected word
	constructor(private channel:vscode.OutputChannel=null){
		this.loadHoverData();
	}

	provideSignatureHelp(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.SignatureHelpContext): vscode.ProviderResult<vscode.SignatureHelp> {		

		let range = document.getWordRangeAtPosition(position, this.re);
		let word = document.getText(range).slice(0, -1); // removes the '('

		this.channel.appendLine("signature " + word);
		const sh = new vscode.SignatureHelp();
		sh.signatures = this.SIG_DATA[word];
		//sh.signatures = [new vscode.SignatureInformation("param here", "documentation here")]
		return sh;
	}

	loadHoverData(){
		const data = {
			"abs":[
				new vscode.SignatureInformation("int abs(int a)", "Returns the absolute value of argument `a`.")
			]
		}

		this.SIG_DATA = {...data, ...this.SIG_DATA};
	}

}

export default CashscriptSignatureCompleter;