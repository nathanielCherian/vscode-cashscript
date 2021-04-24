import * as vscode from 'vscode';

class CashscriptHoverProvider implements vscode.HoverProvider{

	HOVER_DATA:{[key:string]:string[]} = {}
	re = /[a-zA-Z0-9]+/g; // regex to get selected word
	constructor(private channel: vscode.OutputChannel = null){
		this.loadHoverData();
	}

	provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {


		let range = document.getWordRangeAtPosition(position, this.re);
		let word = document.getText(range);
		if(word.includes("\n")) // Stop multi-line bug
			return null;

		this.channel.appendLine("hover: "+word)
		return new vscode.Hover(this.getHoverAnnotation(word), range);
	}


	getHoverAnnotation(word:string){
		
		const annotations = this.HOVER_DATA[word];
		if(annotations)
			return annotations.map(str => new vscode.MarkdownString(str));

		
		return null;
	}
	
	loadHoverData(){
		const data = {
			"abs":[
				"int abs(int a)",
				"Returns the absolute value of argument `a`."
			],
		}

		this.HOVER_DATA = {...data, ...this.HOVER_DATA};
	}

}

export default CashscriptHoverProvider;