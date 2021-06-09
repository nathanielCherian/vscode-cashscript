import * as vscode from 'vscode';
import { MarkedString } from 'vscode-languageclient';
import { LANGUAGE } from './LanguageDesc';

class CashscriptHoverProvider implements vscode.HoverProvider{

	re = /[a-zA-Z0-9]+/g; // regex to get selected word
	constructor(private channel: vscode.OutputChannel = null){}

	provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {


		let range = document.getWordRangeAtPosition(position, this.re);
		let word = document.getText(range);

		//this.channel.appendLine("hoverword: "+word)
		const annotation = this.getHoverAnnotation(word);
		if(annotation) return new vscode.Hover(annotation, range);

		const miscel = this.getMiscellaneousHovers(document, position);
		if(miscel) return new vscode.Hover(miscel, range)

		// check special words

		const dotHovers = this.getTxDotHovers(document, position);
		if(dotHovers) return new vscode.Hover(dotHovers, range)

		const varTypes = this.getVariableTypes(document, word); // fix this
		if(varTypes) return new vscode.Hover(varTypes, range);

		return null;
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
	* Very bad way to get type annotations, better option: custom Tree Builder
	*/
	getVariableTypes(document:vscode.TextDocument, targetWord:string):vscode.MarkdownString[]{
		const reg = /([a-zA-Z0-9]+)\s+(pk)[^a-zA-Z0-9]/;
		const text = document.getText();
		const matches = text.match(new RegExp(`([a-zA-Z0-9]+)\\s+(${targetWord})[^a-zA-Z0-9]`)); //regex still incomplete
		if(!matches) return null;

		return [
			new vscode.MarkdownString().appendCodeblock(`${matches[1]} ${matches[2]}`),
		]
	}

	getTxDotHovers(document:vscode.TextDocument, position:vscode.Position):vscode.MarkdownString[]{
		const reg = /tx.[a-zA-Z0-9]+/;
		let range = document.getWordRangeAtPosition(position, reg);
		let word = document.getText(range).substring(3);

		// /### tx.(\w+)\n+```solidity\n(.+)\n```/
		const TX_HOVERS = {
			time:{
				code:'require(tx.time >= <expression>);'
			},
			age:{
					code:'require(tx.age >= <expression>);'
			},
			version:{
					code:'bytes4 tx.version'
			},
			hashPrevouts:{
					code:'bytes32 tx.hashPrevouts'
			},
			hashSequence:{
					code:'bytes32 tx.hashSequence'
			},
			outpoint:{
					code:'bytes36 tx.outpoint'
			},
			bytecode:{
					code:'bytes tx.bytecode'
			},
			value:{
					code:'bytes8 value'
			},
			sequence:{
					code:'bytes4 tx.sequence'
			},
			hashOutputs:{
					code:'bytes32 tx.hashOutputs'
			},
			locktime:{
				code:'bytes4 tx.locktime'
			},
			hashtype:{
				code:'bytes4 tx.hashtype'
			},
		}


		return [
			new vscode.MarkdownString().appendCodeblock(TX_HOVERS[word].code)
		];
	}

}

export default CashscriptHoverProvider;