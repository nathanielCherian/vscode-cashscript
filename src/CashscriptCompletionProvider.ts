import * as vscode from 'vscode';
import { Range, CompletionItem, CompletionItemKind } from 'vscode';
import { DOT_COMPLETIONS } from './LanguageDesc';

export default class CashscriptCompletionProvider implements vscode.CompletionItemProvider{

    text=""
    offset=0
    currentIndex = 0;
    doc:vscode.TextDocument;
    pos:vscode.Position;

    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[]> {
        // throw new Error('Method not implemented.');
        this.doc = document;
        this.pos = position;
        this.text = document.getText() || "";
		this.offset = document.offsetAt(position) || 0;
        this.currentIndex = 0;

        const completions: CompletionItem[] = this.getAllCompletions();
        return completions;
    }

    getAllCompletions(): CompletionItem[]{
		let completions:CompletionItem[] = [];

		if(this.isDot()){
			return this.getDotCompletions();
		}

		completions = completions.concat(this.getVarCompletions());
		// completions = completions.concat(this.getConditionalCompletions());
		completions = completions.concat(this.getControlCompletions());
		completions = completions.concat(this.getGlobalFunctionCompletions());
		completions = completions.concat(this.getOutputCompletions());
		completions = completions.concat(this.getTypesCompletions());
		completions = completions.concat(this.getGlobalConstantsCompletions());

		return completions;
	}

	protected getCharRange(begin:number, end:number){
		return this.text.substring(begin, end);
	}

	protected isDot():boolean{
		const offset:number = this.doc?.offsetAt(this.pos) || 0;
		const t = this.getCharRange(offset-1, offset);
		if(t === '.') return true;
		return false;
	}

	protected getDotCompletions():CompletionItem[]{

		const re = /(\w+)(\[.+\])?.$/ // EX: "tx."
		const range:Range = new Range(new vscode.Position(this.pos.line, 0), this.pos)
		const text = this.doc.getText(range);
		var arr, keyword;
		if((arr=text?.match(re))){
			keyword = arr[1];
			if(arr[2]) keyword+="_indexed"; // ex. inputs[0].
			console.log("keyword: ", keyword);

			return DOT_COMPLETIONS[keyword];
		}

		return []
	}

	protected getVarCompletions():CompletionItem[]{

		const re = /(int|bool|string|pubkey|sig|datasig|byte|bytes|bytes[0-9]+)\s+(\w+)/g;
		const completions:CompletionItem[] = [];
		for(const m of this.text.matchAll(re)){
			completions.push({
				label:m[2],
				kind:CompletionItemKind.Variable
			});
		}

		return completions;
	}

	// protected getConditionalCompletions():CompletionItem[]{
	// 	const completions:CompletionItem[] = [];
	// 	if(!this.text.includes("contract")){
	// 		completions.push({
	// 			label:"contract",
	// 			detail:"Instantiate a new Contract",
	// 			insertText:"contract ${1:ContractName}($2) {\n\n}",
	// 		});
	// 	}

	// 	return completions;
	// }


	protected getControlCompletions():CompletionItem[]{
		const words = ["pragma", "cashscript", "if", "else", "require"]
		const completions = [];
		for (let i = 0; i < words.length; i++) {
			this.currentIndex += 1;
			completions.push(
                new CompletionItem(words[i])
			);
		}
		return completions;
	}

	protected getGlobalFunctionCompletions():CompletionItem[]{
		const words = ["abs", "min", "max", "within",
						"ripemd160", "sha1", "sha256", "hash160", "hash256",
						"checkSig", "checkMultiSig", "checkDataSig", "require"]

		return [
			{
				label:"abs",
				detail: 'int abs(int a): Returns the absolute value of argument a.',
				insertText: 'abs',
				// insertTextFormat: 2,
			},
			{
				label:"min",
				detail:"int min(int a, int b): Returns the minimum value of arguments `a` and `b`.",
				insertText:"min",
				// insertTextFormat:2
			},
			{
				label:"max",
				detail:"int max(int a, int b): Returns the maximum value of arguments `a` and `b`.",
				insertText:"max",
				// insertTextFormat:2
			},
			{
				label:"within",
				detail:"bool within(int x, int lower, int upper): Returns `true` if and only if `x >= lower && x < upper`.",
				insertText:"within",
				// insertTextFormat:2
			},
			{
				label:"ripemd160",
				detail:"bytes20 ripemd160(any x): Returns the SHA-1 hash of argument `x`.",
				insertText:"ripemd160",
				// insertTextFormat:2
			},
			{
				label:"sha256",
				detail:"bytes32 sha256(any x): Returns the SHA-256 hash of argument `x`.",
				insertText:"sha256",
				// insertTextFormat:2
			},
			{
				label:"hash160",
				detail:"bytes20 hash160(any x): Returns the RIPEMD-160 hash of the SHA-256 hash of argument `x`.",
				insertText:"hash160",
				// insertTextFormat:2
			},
			{
				label:"hash256",
				detail:"bytes32 hash256(any x): bytes32 hash256(any x)",
				insertText:"hash256",
				// insertTextFormat:2
			},
			{
				label:"checkSig",
				detail:"bool checksig(sig s, pubkey pk): Checks that transaction signature `s` is valid for the current transaction and matches with public key `pk`.",
				insertText:"checkSig",
				// insertTextFormat:2
			},
			{
				label:"checkMultiSig",
				detail:"bool checkMultiSig(sig[] sigs, pubkey[] pks): Performs a multi-signature check using a list of transaction signatures and public keys.",
				insertText:"checkMultiSig",
				// insertTextFormat:2
			},
			{
				label:"checkDataSig",
				detail:"bool checkDataSig(datasig s, bytes msg, pubkey pk): Checks that sig `s` is a valid signature for message `msg` and matches with public key `pk`.",
				insertText:"checkDataSig",
				// insertTextFormat:2
			},
			{
				label:"require",
				detail:"require(bool expression, string debugMessage?): Puts a constraint on the `expression` failing the script execution if expression resolves to false. `debugMessage` will be present in the error log of the debug evaluation of the script. Has no effect in production.",
				insertText:"require",
				// insertTextFormat:2
			},
			{
				label:"require",
				detail:"require(bool expression): Puts a constraint on the `expression` failing the script execution if expression resolves to false",
				insertText:"require",
				// insertTextFormat:2
			},
			{
				label:"console.log",
				detail:"console.log(...args): Logs primitve data or variable values to debug console. Has no effect in production.",
				insertText:"console.log",
				// insertTextFormat:2
			}
		]
	}

	protected getOutputCompletions():CompletionItem[]{
		const words = ["LockingBytecodeP2PKH", "LockingBytecodeP2SH20", "LockingBytecodeP2SH32", "LockingBytecodeNullData"]
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
		const words = ["int", "bool", "string", "byte", "bytes", "pubkey", "sig", "datasig", "true", "false", "date"]
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
		const words = ["sats", "satoshis", "finney", "bit", "bitcoin", "seconds", "minutes", "hours", "days", "weeks", "tx"];
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
