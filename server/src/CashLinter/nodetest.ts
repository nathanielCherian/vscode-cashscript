import { ANTLRInputStream, CommonTokenStream } from 'antlr4ts';
import { Ast } from './ast/AST';
import AstBuilder from './ast/AstBuilder';
import { SafeErrorListener, SafeErrorStrategy } from './ErrorListeners';
import { CashScriptLexer } from './grammar/CashScriptLexer';
import { CashScriptParser } from './grammar/CashScriptParser';


let code = `
pragma cashscript ^0.6.0;
contract P2PKH(bytes20 pkh) {
    function spend( pubkey pk  , sig s) {
        require(hashs160(pk) == pkh);
        require(checkSig(sf, pk));
        require(checkSig(s, pk));
    }

}
`;

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

console.log(errListener.getErrs())
const astBuilder = new AstBuilder(parseTree);
const ast = astBuilder.build() as Ast;
console.log(astBuilder.parameterCollector);