import * as vscode from 'vscode';
import { MarkedString } from 'vscode-languageclient';
import { LANGUAGE } from './LanguageDesc';

class CashscriptHoverProvider implements vscode.HoverProvider{

	re = /[a-zA-Z0-9]+/g; // regex to get selected word
	constructor(private channel: vscode.OutputChannel = null){}

	provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {


		let range = document.getWordRangeAtPosition(position, this.re);
		let word = document.getText(range);

		
		this.channel.appendLine("hover: "+word)
		return new vscode.Hover(this.getHoverAnnotation(word), range);
	}


	getHoverAnnotation(word:string){
		
		const data = LANGUAGE[word];
		return [
			new vscode.MarkdownString().appendCodeblock(data.code),
			new vscode.MarkdownString(data.codeDesc)
		]
		
	}
	

}

export default CashscriptHoverProvider;