import * as vscode from 'vscode';
import { MarkedString } from 'vscode-languageclient';
import { LANGUAGE } from './LanguageDesc';

class CashscriptHoverProvider implements vscode.HoverProvider{

	re = /[a-zA-Z0-9]+/g; // regex to get selected word
	constructor(private channel: vscode.OutputChannel = null){}

	provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {


		let range = document.getWordRangeAtPosition(position, this.re);
		let word = document.getText(range);

		this.channel.appendLine("hoverword: "+word)
		const annotation = this.getHoverAnnotation(word);
		if(annotation) return new vscode.Hover(annotation, range);

		const miscel = this.getMiscellaneousHovers(document, position);
		if(miscel) return new vscode.Hover(miscel, range)

		// check special words

		const varTypes = this.getVariableTypes(document, word); // fix this
		return new vscode.Hover(varTypes, range);
	}


	getHoverAnnotation(word:string):vscode.MarkdownString[]{

		const data = LANGUAGE[word] || null;
		if(!data) return null;

		return [
			new vscode.MarkdownString().appendCodeblock(data.code),
			new vscode.MarkdownString(data.codeDesc)
		]
	}


	getMiscellaneousHovers(document:vscode.TextDocument, position:vscode.Position):vscode.MarkdownString[]{

		const reg = /(contract|function)\s+(\w+)\s*\(.*\)/;
		let range = document.getWordRangeAtPosition(position, reg);
		let word = document.getText(range);
		if(word.includes("\n")) return null;

		return [
			new vscode.MarkdownString().appendCodeblock(word)
		];
	}

	/*
	* Very bad way to get type annotations, better option: custom linter
	*/
	getVariableTypes(document:vscode.TextDocument, targetWord:string):vscode.MarkdownString[]{
		const reg = /([a-zA-Z0-9]+)\s+(pk)[^a-zA-Z0-9]/;
		const text = document.getText();
		const matches = text.match(new RegExp(`([a-zA-Z0-9]+)\\s+(${targetWord})[^a-zA-Z0-9]`));
		if(!matches) return null;

		return [
			new vscode.MarkdownString().appendCodeblock(`${matches[1]} ${matches[2]}`),
		]
	}

}

export default CashscriptHoverProvider;