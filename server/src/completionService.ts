import { CompletionItem, CompletionItemKind } from 'vscode-languageserver';

export default class CompletionService {

	protected currentIndex: number = 0;

	getAllCompletions(): CompletionItem[]{
		let completions:CompletionItem[] = [];
		completions = completions.concat(this.getControlCompletions());
		completions = completions.concat(this.getGlobalFunctionCompletions());
		completions = completions.concat(this.getTypesCompletion());
		return completions;
	}


	protected getControlCompletions():CompletionItem[]{
		const words = ["pragma", "cashscript", "if", "else", "require"]
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

	protected getGlobalFunctionCompletions():CompletionItem[]{
		const words = ["abs","min","max","within",
						"ripemd160", "sha1", "sha256", "hash160","hash256",
						"checkSig", "checkMultiSig", "checkDataSig"]

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

	protected getTypesCompletion():CompletionItem[]{
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

}