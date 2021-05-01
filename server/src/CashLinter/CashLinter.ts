import { ANTLRInputStream, CommonTokenStream } from 'antlr4ts';
import { Diagnostic } from 'vscode-languageserver';
import { SafeErrorListener, SafeErrorStrategy } from './ErrorListeners';
import { CashScriptLexer } from './grammar/CashScriptLexer';
import { CashScriptParser } from './grammar/CashScriptParser';

export default class CashLinter {

	static getDiagnostics(code:string):Diagnostic[]{

	
		const errListener = new SafeErrorListener();

		const inputStream = new ANTLRInputStream(code);
		const lexer = new CashScriptLexer(inputStream);
		lexer.removeErrorListeners();
		lexer.addErrorListener(errListener);

		const tokenStream = new CommonTokenStream(lexer);
		const parser = new CashScriptParser(tokenStream);
		parser.errorHandler = new SafeErrorStrategy();
		parser.removeErrorListeners();
		parser.addErrorListener(errListener);
		const parseTree = parser.sourceFile();
		
		return errListener.getErrs()
	}

}


