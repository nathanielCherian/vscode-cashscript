import {CashCompiler} from "cashscript";

export default class CompilerErrors{

	static checkErrors(file:string){

		var s = "";
		(function(){
			var oldLog = console.log;
			console.log = function (message:any){
				s += message;
			};

			CashCompiler.compileString(file);

			console.log = oldLog;
		})();

	}
}