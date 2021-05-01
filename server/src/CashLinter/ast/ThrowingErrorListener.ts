/* eslint-disable @typescript-eslint/no-unused-vars */
import { ANTLRErrorListener, ANTLRErrorStrategy, DefaultErrorStrategy, Parser, RecognitionException, Recognizer, Token } from 'antlr4ts';
import { ParseError } from '../Errors';
import { Point } from './Location';

/**
 * ANTLR Error Listener that immediately throws on error. This is used so that
 * ANTLR doesn't attempt any error recovery during lexing/parsing and fails early.
 */
export default class ThrowingErrorListener implements ANTLRErrorListener<any> {
  static readonly INSTANCE = new ThrowingErrorListener();

  syntaxError<T>(
    recognizer: Recognizer<T, any>,
    offendingSymbol: T,
    line: number,
    charPositionInLine: number,
    message: string,
    e?: RecognitionException,
  ): void {
    const capitalisedMessage = message.charAt(0).toUpperCase() + message.slice(1);
    throw new ParseError(capitalisedMessage, new Point(line, charPositionInLine));
  }
}

export class SafeErrorListener implements ANTLRErrorListener<any> {
  static readonly INSTANCE = new SafeErrorListener();

  errs:string[] = []

  getErrs():string[]{
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
    this.errs.push(capitalisedMessage);
    console.log(capitalisedMessage);
  }
}


export class ErrorStrategy extends DefaultErrorStrategy{
  // reset(recognizer: Parser): void {
  //   return;
  //   throw new Error('Method not implemented.');
  // }
  // recoverInline(recognizer: Parser): Token {
  //   throw new Error('Method not implemented.');
  // }
  // recover(recognizer: Parser, e: RecognitionException): void {
  //   return
  //   throw new Error('Method not implemented.');
  // }
  sync(recognizer: Parser): void {
    return
    throw new Error('Method not implemented.');
  }
  // inErrorRecoveryMode(recognizer: Parser): boolean {
  //   return true;
  //   throw new Error('Method not implemented.');
  // }
  // reportMatch(recognizer: Parser): void {
  //   return
  //   throw new Error('Method not implemented.');
  // }
  // reportError(recognizer: Parser, e: RecognitionException): void {
  //   return
  //   throw new Error('Method not implemented.');
  // }

}