
interface Data {
	[key:string]:{
		code:string,
		codeDesc:string,
	}
}


// Regex to match: (### (\w+)\(\)\n```solidity\n(.*)\n```\n\n(.*))
let GLOBAL_FUNCTIONS:Data = {
	abs:{
		code:'int abs(int a)',
		codeDesc:'Returns the absolute value of argument `a`.',  
	},
	min:{
		code:'int min(int a, int b)',
		codeDesc:'Returns the minimum value of arguments `a` and `b`.',  
	},
	max:{
		code:'int max(int a, int b)',
		codeDesc:'Returns the maximum value of arguments `a` and `b`.',  
	},
	within:{
		code:'bool within(int x, int lower, int upper)',
		codeDesc:'Returns `true` if and only if `x >= lower && x < upper`.',  
	},
	ripemd160:{
		code:'bytes20 ripemd160(any x)',
		codeDesc:'Returns the RIPEMD-160 hash of argument `x`.',  
	},
	sha1:{
		code:'bytes20 sha1(any x)',
		codeDesc:'Returns the SHA-1 hash of argument `x`.',  
	},
	sha256:{
		code:'bytes32 sha256(any x)',
		codeDesc:'Returns the SHA-256 hash of argument `x`.',  
	},
	hash160:{
		code:'bytes20 hash160(any x)',
		codeDesc:'Returns the RIPEMD-160 hash of the SHA-256 hash of argument `x`.',  
	},
	hash256:{
		code:'bytes32 hash256(any x)',
		codeDesc:'Returns the double SHA-256 hash of argument `x`.',  
	},
	checkSig:{
		code:'bool checkSig(sig s, pubkey pk)',
		codeDesc:'Checks that transaction signature `s` is valid for the current transaction and matches with public key `pk`.',  
	},
	checkMultiSig:{
		code:'bool checkMultiSig(sig[] sigs, pubkey[] pks)',
		codeDesc:'Performs a multi-signature check using a list of transaction signatures and public keys.',  
	},
	checkDataSig:{
		code:'bool checkDataSig(datasig s, bytes msg, pubkey pk)',
		codeDesc:'Checks that sig `s` is a valid signature for message `msg` and matches with public key `pk`.',  
	},
}


let OUTPUT_INSTANTIATION:Data = {
	OutputP2PKH:{
		code:'new OutputP2PKH(bytes8 amount, bytes20 pkh): bytes34',
		codeDesc:'Creates new P2PKH output serialisation for an output sending `amount` to `pkh`.',  
	},
	OutputP2SH:{
		code:'new OutputP2SH(bytes8 amount, bytes20 scriptHash): bytes32',
		codeDesc:'Creates new P2SH output serialisation for an output sending `amount` to `scriptHash`.',  
	},
	OutputNullData:{
		code:'new OutputNullData(bytes[] chunks): bytes',
		codeDesc:'Creates new OP_RETURN output serialisation for an output containing an OP_RETURN script with `chunks` as its data.',  
	},
}

let STATEMENTS:Data = {
	require:{
		code:'null require( exp )',
		codeDesc:"Takes a boolean expression, if it evaluates to 'false' the contract fails. Used to ensure requirements"
	}
}

let TYPECASTS:Data = {
	int:{
		code:"int int( v )",
		codeDesc:"Converts to int"
	}
}

let LANGUAGE:Data = {...GLOBAL_FUNCTIONS, ...OUTPUT_INSTANTIATION, ...STATEMENTS};

export { GLOBAL_FUNCTIONS, OUTPUT_INSTANTIATION, TYPECASTS, LANGUAGE };