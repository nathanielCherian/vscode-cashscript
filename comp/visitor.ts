import { CashScriptVisitor } from './grammar/CashScriptVisitor'
import {
	PragmaDirectiveContext
} from './grammar/CashScriptParser'
import { AbstractParseTreeVisitor } from 'antlr4ts/tree/AbstractParseTreeVisitor'
import { CashScriptParser } from './grammar/CashScriptParser';
import { RuleNode } from 'antlr4ts/tree/RuleNode';

export class CountFunctionsVisitor extends AbstractParseTreeVisitor<Node> implements CashScriptVisitor<Node> {
	protected defaultResult(): Node {
		throw new Error('Method not implemented.');
	}

	processPragma(ctx: PragmaDirectiveContext): void {
		console.log("REACHED")
		// const pragmaName = getPragmaName(ctx.pragmaName().text);
		// if (pragmaName !== PragmaName.CASHSCRIPT) throw new Error(); // Shouldn't happen
	
		// // Strip any -beta tags
		// const actualVersion = version.replace(/-.*/g, '');
	
		// ctx.pragmaValue().versionConstraint().forEach((constraint) => {
		//   const op = getVersionOpFromCtx(constraint.versionOperator());
		//   const versionConstraint = `${op}${constraint.VersionLiteral().text}`;
		//   if (!semver.satisfies(actualVersion, versionConstraint)) {
		// 	throw new VersionError(actualVersion, versionConstraint);
		//   }
		// });
	}
}