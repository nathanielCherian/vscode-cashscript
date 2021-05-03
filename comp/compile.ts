import { ANTLRInputStream, CommonTokenStream } from 'antlr4ts';
import { CashScriptLexer } from './grammar/CashScriptLexer';
import { CashScriptParser } from './grammar/CashScriptParser';
import { CountFunctionsVisitor } from './visitor';

let code = `
pragma cashscript ^0.6.0;
contract P2PKH(bytes20 pkh) {
    function spend( pubkey pk  , sig s) {
        require(hash160(pk) == pkh);
        require(checkSig(s, pk));
        require(checkSig(s, pk));
    }

}
`

let inputStream = new ANTLRInputStream(code);
let lexer = new CashScriptLexer(inputStream);
let tokenStream = new CommonTokenStream(lexer);
let parser = new CashScriptParser(tokenStream);

let tree = parser.sourceFile();

console.log(tree)

const cf = new CountFunctionsVisitor();
cf.visit(tree);