import { CompletionItem, CompletionItemKind, TextDocumentIdentifier, TextDocumentPositionParams } from 'vscode-languageserver';
import { Position, TextDocument } from 'vscode-languageserver-textdocument';

export default class CompletionService {

	protected currentIndex: number = 0;
	private lines: string[] = [];
	private text: string = "";
	constructor(public doc: TextDocument|undefined, public pos: Position){
		if(doc){
			this.text = doc.getText();
			this.lines = this.text.split(/\r?\n/g);
		}
	}

	getAllCompletions(): CompletionItem[]{
		let completions:CompletionItem[] = [];
		completions = completions.concat(this.getControlCompletions());
		completions = completions.concat(this.getGlobalFunctionCompletions());
		completions = completions.concat(this.getOutputCompletions());
		completions = completions.concat(this.getTypesCompletions());
		completions = completions.concat(this.getGlobalConstantsCompletions());
		completions = completions.concat(this.getDotCompletions());

		return completions;
	}

	protected getCharRange(begin:number, end:number){
		return this.text.substring(begin, end);
	}
	
	protected getDotCompletions():CompletionItem[]{

		return [
			CompletionItem.create("age")
		]
		const re = /tx\./;
		console.log(this.lines[this.pos.line]);
		const offset:number = this.doc?.offsetAt(this.pos) || 0;
		const t = this.getCharRange(offset-3, offset)
		console.log("dot: ", t);
		if(t === "tx."){
			return [
				CompletionItem.create("age")
			]
		}
		//console.log(this.doc?.getText().charAt(this.doc?.offsetAt(this.pos)-1));
		return [
			CompletionItem.create("tx")
		]
	}

	protected getControlCompletions():CompletionItem[]{
		const words = ["pragma", "cashscript", "if", "else", "require"]
		const completions = [];
		for (let i = 0; i < words.length; i++) {
			this.currentIndex += 1;
			completions.push(
				CompletionItem.create(words[i])
			);		
		}
		return completions;
	}

	protected getGlobalFunctionCompletions():CompletionItem[]{
		const words = ["abs","min","max","within",
						"ripemd160", "sha1", "sha256", "hash160","hash256",
						"checkSig", "checkMultiSig", "checkDataSig"]

		const comps: CompletionItem[] = [
			{
				label:"abs",
				detail: 'int abs(int a): Returns the absolute value of argument a.',
				insertText: 'abs(${1:value});',
				insertTextFormat: 2,
			},
			{
				label:"min",
				detail:"int min(int a, int b): Returns the minimum value of arguments `a` and `b`.",
				insertText:"min(${1:a}, ${2:b})",
				insertTextFormat:2
			},
			{
				label:"max",
				detail:"int max(int a, int b): Returns the maximum value of arguments `a` and `b`.",
				insertText:"max(${1:a}, ${2:b})",
				insertTextFormat:2
			},
			{
				label:"within",
				detail:"bool within(int x, int lower, int upper): Returns `true` if and only if `x >= lower && x < upper`.",
				insertText:"within(${1:x}, ${2:lower}, ${3:upper})",
				insertTextFormat:2
			},
			{
				label:"ripemd160",
				detail:"bytes20 ripemd160(any x): Returns the SHA-1 hash of argument `x`.",
				insertText:"ripemd160(${1:x})",
				insertTextFormat:2
			},
			{
				label:"sha256",
				detail:"bytes32 sha256(any x): Returns the SHA-256 hash of argument `x`.",
				insertText:"sha256(${1:x})",
				insertTextFormat:2
			},
			{
				label:"hash160",
				detail:"bytes20 hash160(any x): Returns the RIPEMD-160 hash of the SHA-256 hash of argument `x`.",
				insertText:"hash160(${1:x})",
				insertTextFormat:2
			},
			{
				label:"hash256",
				detail:"bytes32 hash256(any x): bytes32 hash256(any x)",
				insertText:"hash256(${1:x})",
				insertTextFormat:2
			},
			{
				label:"checkMultiSig",
				detail:"bool checkMultiSig(sig[] sigs, pubkey[] pks): Performs a multi-signature check using a list of transaction signatures and public keys.",
				insertText:"checkMultiSig(${1:sigs}, ${2:pks})",
				insertTextFormat:2
			},
			{
				label:"checkDataSig",
				detail:"bool checkDataSig(datasig s, bytes msg, pubkey pk): Checks that sig `s` is a valid signature for message `msg` and matches with public key `pk`.",
				insertText:"checkDataSig(${1:signature}, ${2:message}, ${3:pubkey})",
				insertTextFormat:2
			}
		]

		return comps;
	}

	protected getOutputCompletions():CompletionItem[]{
		const words = ["OutputP2PKH", "OutputP2PSH", "OutputNullData"]
		const completions = [];
		for (let i = 0; i < words.length; i++) {
			this.currentIndex += 1;
			completions.push(
				{
					label: words[i],
					kind: CompletionItemKind.Keyword,
					data: i+1	
				}
			);		
		}
		return completions;
	}

	protected getTypesCompletions():CompletionItem[]{
		const words = ["int", "bool", "string", "bytes", "pubkey", "sig", "datasig", "true", "false"]
		const completions = [];
		for (let i = 0; i < words.length; i++) {
			this.currentIndex += 1;
			completions.push(
				{
					label: words[i],
					kind: CompletionItemKind.Keyword,
					data: i+1	
				}
			);		
		}
		return completions;
	}

	protected getGlobalConstantsCompletions():CompletionItem[]{
		const words = ["sats", "satoshis", "finney", "bit", "bitcoin", "seconds", "minutes", "hours", "days", "weeks"];
		const completions = [];
		for (let i = 0; i < words.length; i++) {
			this.currentIndex += 1;
			completions.push(
				{
					label: words[i],
					kind: CompletionItemKind.Keyword,
					data: i+1	
				}
			);		
		}
		return completions;
	}

}