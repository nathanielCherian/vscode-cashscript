import { ANTLRInputStream, CommonTokenStream } from 'antlr4ts';
import { Diagnostic } from 'vscode-languageserver';
import { SafeErrorListener } from './ErrorListeners';
import { CashScriptLexer } from './grammar/CashScriptLexer';
import { CashScriptParser } from './grammar/CashScriptParser';

export default class CashLinter {

	static getDiagnostics(code:string):Diagnostic[]{
		const inputStream = new ANTLRInputStream(code);
		const lexer = new CashScriptLexer(inputStream);
	
		const errListener = new SafeErrorListener();
		lexer.removeErrorListeners();
		lexer.addErrorListener(errListener);
		const tokenStream = new CommonTokenStream(lexer);
		const parser = new CashScriptParser(tokenStream);
		parser.removeErrorListeners();
		parser.addErrorListener(errListener);
		const parseTree = parser.sourceFile();
	
		return errListener.getErrs()
	}

}


