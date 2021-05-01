import { ANTLRErrorListener, RecognitionException, Recognizer } from 'antlr4ts';
import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver';

export class SafeErrorListener implements ANTLRErrorListener<any> {
  
	errs:Diagnostic[] = []
  
	getErrs():Diagnostic[]{
	  return this.errs;
	}
  
  
	syntaxError<T>(
	  recognizer: Recognizer<T, any>,
	  offendingSymbol: T,
	  line: number,
	  charPositionInLine: number,
	  message: string,
	  e?: RecognitionException,
	): void {
	  const capitalisedMessage = message.charAt(0).toUpperCase() + message.slice(1);

	 console.log(capitalisedMessage);
	  const range:Range = {
		  start:{
			  line:line-1,
			  character:charPositionInLine
		  },
		  end:{
			  line:line-1,
			  character:charPositionInLine
		  }
	  }

	  console.log(range)
	  const diag = Diagnostic.create(range, capitalisedMessage, DiagnosticSeverity.Error)
	  this.errs.push(diag);
	  //console.log(capitalisedMessage);
	}
  }
  