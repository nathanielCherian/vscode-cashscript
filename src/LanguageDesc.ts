import { CompletionItem, CompletionItemKind } from 'vscode';

interface Data {
  [key: string]: {
    code: string;
    codeDesc: string;
  };
}

// Regex to match: (### (\w+)\(\)\n```solidity\n(.*)\n```\n\n(.*))
let GLOBAL_FUNCTIONS: Data = {
  abs: {
    code: 'int abs(int a)',
    codeDesc: 'Returns the absolute value of argument `a`.',
  },
  min: {
    code: 'int min(int a, int b)',
    codeDesc: 'Returns the minimum value of arguments `a` and `b`.',
  },
  max: {
    code: 'int max(int a, int b)',
    codeDesc: 'Returns the maximum value of arguments `a` and `b`.',
  },
  within: {
    code: 'bool within(int x, int lower, int upper)',
    codeDesc: 'Returns `true` if and only if `x >= lower && x < upper`.',
  },
  ripemd160: {
    code: 'bytes20 ripemd160(any x)',
    codeDesc: 'Returns the RIPEMD-160 hash of argument `x`.',
  },
  sha1: {
    code: 'bytes20 sha1(any x)',
    codeDesc: 'Returns the SHA-1 hash of argument `x`.',
  },
  sha256: {
    code: 'bytes32 sha256(any x)',
    codeDesc: 'Returns the SHA-256 hash of argument `x`.',
  },
  hash160: {
    code: 'bytes20 hash160(any x)',
    codeDesc: 'Returns the RIPEMD-160 hash of the SHA-256 hash of argument `x`.',
  },
  hash256: {
    code: 'bytes32 hash256(any x)',
    codeDesc: 'Returns the double SHA-256 hash of argument `x`.',
  },
  checkSig: {
    code: 'bool checkSig(sig s, pubkey pk)',
    codeDesc:
      'Checks that transaction signature `s` is valid for the current transaction and matches with public key `pk`.',
  },
  checkMultiSig: {
    code: 'bool checkMultiSig(sig[] sigs, pubkey[] pks)',
    codeDesc: 'Performs a multi-signature check using a list of transaction signatures and public keys.',
  },
  checkDataSig: {
    code: 'bool checkDataSig(datasig s, bytes msg, pubkey pk)',
    codeDesc: 'Checks that sig `s` is a valid signature for message `msg` and matches with public key `pk`.',
  },
  require: {
    code: 'require(bool expression, string debugMessage?)',
    codeDesc:
      'Puts a constraint on the `expression` failing the script execution if expression resolves to false. `debugMessage` will be present in the error log of the debug evaluation of the script. Has no effect in production.',
  },
  'console.log': {
    code: 'console.log(...args)',
    codeDesc: 'Logs primitve data or variable values to debug console. Has no effect in production.',
  },
  toPaddedBytes: {
    code: 'bytes toPaddedBytes(int value, int size)',
    codeDesc:
      'Converts an integer `value` to a bytes sequence of length `size`, padded with zero-bytes. Fails at runtime if the integer does not fit into `size` bytes.',
  },
};

let INSTANTIATIONS: Data = {
  LockingBytecodeP2PKH: {
    code: 'new LockingBytecodeP2PKH(bytes20 pkh): bytes25',
    codeDesc: 'Creates new P2PKH locking bytecode for the public key hash `pkh`.',
  },
  LockingBytecodeP2SH20: {
    code: 'new LockingBytecodeP2SH20(bytes20 scriptHash): bytes23',
    codeDesc:
      'Creates new P2SH20 locking bytecode for the script hash, where `scriptHash` is the hash160() of your script.',
  },
  LockingBytecodeP2SH32: {
    code: 'new LockingBytecodeP2SH32(bytes32 scriptHash): bytes35',
    codeDesc:
      'Creates new P2SH32 locking bytecode for the script hash, where `scriptHash` is the hash256() of your script.',
  },
  LockingBytecodeNullData: {
    code: 'new LockingBytecodeNullData(bytes[] chunks): bytes',
    codeDesc: 'Creates new OP_RETURN locking bytecode with `chunks` as its OP_RETURN data.',
  },
};

// Statement-level constructs (grammar rules `importDirective` and `returnStatement`)
let STATEMENTS: Data = {
  import: {
    code: 'import "path/to/file.cash";',
    codeDesc:
      'Imports the reusable functions and global constants declared in another CashScript file. Paths starting with `./`, `../` or `/` are resolved relative to this file; any other path is a package import, resolved from `node_modules` (e.g. `import "mathlib/math.cash";`). Import directives must appear at the top of the file, after any `pragma` directives. Available since CashScript 0.14.',
  },
  return: {
    code: 'return expression(, expression...)',
    codeDesc:
      'Returns one or more comma-separated values from a user-defined function. Must be the final statement of the function body (no early or conditional returns). Available since CashScript 0.14.',
  },
};

// Keywords that are part of a declaration header rather than statements
let DECLARATION_KEYWORDS: Data = {
  returns: {
    code: 'function name(params) returns (T1, T2, ...)',
    codeDesc:
      'Declares the return type(s) of a user-defined function. A call to a function with multiple return values must be destructured into exactly one target per return value (`int a, int b = fn()`). Targets without a type reassign an existing variable, optionally mixed with fresh declarations and optionally parenthesised (`(a, int b) = fn()`); declared targets accept the `constant` and `unused` modifiers. A function without a `returns` clause returns nothing and is called as a statement. Available since CashScript 0.14.',
  },
};

// Declaration modifiers (grammar rule `modifier`), valid between a type name and an identifier
let MODIFIERS: Data = {
  constant: {
    code: 'type constant NAME = expression',
    codeDesc:
      'Marks a variable as immutable. At the top level of a file (outside the contract), declares a global constant whose initialiser is evaluated at compile time: literals, references to other constants, integer arithmetic and string/bytes concatenation are supported. Global constants can be shared between files with `import` (CashScript 0.14+).',
  },
  unused: {
    code: 'type unused name',
    codeDesc:
      'Marks a parameter or variable as intentionally unused, which silences the compiler warning for unused variables. The value is dropped from the stack immediately after its declaration and cannot be referenced later. Useful for padding contract bytecode (higher opcost budget) or for nonces to differentiate between similar contracts. Available since CashScript 0.14.',
  },
};

let UNITS: Data = {
  satoshis: {
    code: 'int * satoshis',
    codeDesc: 'Satoshi unit. 1 satoshi = 1. The base unit of a BCH amount.',
  },
  sats: {
    code: 'int * sats',
    codeDesc: 'Alias for `satoshis`. 1 sats = 1.',
  },
  finney: {
    code: 'int * finney',
    codeDesc: '1 finney = 10 satoshis.',
  },
  bits: {
    code: 'int * bits',
    codeDesc: '1 bits = 100 satoshis.',
  },
  bitcoin: {
    code: 'int * bitcoin',
    codeDesc: '1 bitcoin = 100_000_000 satoshis.',
  },
  seconds: {
    code: 'int * seconds',
    codeDesc: 'Time unit. 1 seconds = 1. The base unit of a time value.',
  },
  minutes: {
    code: 'int * minutes',
    codeDesc: '1 minutes = 60 seconds.',
  },
  hours: {
    code: 'int * hours',
    codeDesc: '1 hours = 3600 seconds.',
  },
  days: {
    code: 'int * days',
    codeDesc: '1 days = 86_400 seconds.',
  },
  weeks: {
    code: 'int * weeks',
    codeDesc: '1 weeks = 604_800 seconds.',
  },
};

let INTROSPECTION: Data = {
  this: {
    code: 'this',
    codeDesc: 'The contract input currently being evaluated.',
  },
  'this.activeInputIndex': {
    code: 'int this.activeInputIndex',
    codeDesc: 'The index of the input whose unlocking script is currently being evaluated.',
  },
  'this.activeBytecode': {
    code: 'bytes this.activeBytecode',
    codeDesc: 'The locking bytecode of the input currently being evaluated (i.e. this contract).',
  },
  'this.age': {
    code: 'int this.age',
    codeDesc:
      'Relative age (sequence-number) check. `require(this.age >= N)` enforces that this input is at least `N` blocks or seconds old (BIP68).',
  },
  tx: {
    code: 'tx',
    codeDesc: 'The transaction currently being evaluated.',
  },
  'tx.version': {
    code: 'int tx.version',
    codeDesc: 'The transaction version field.',
  },
  'tx.locktime': {
    code: 'int tx.locktime',
    codeDesc: 'The transaction locktime field.',
  },
  'tx.time': {
    code: 'int tx.time',
    codeDesc:
      'Absolute locktime check. `require(tx.time >= N)` enforces that the transaction is only valid after block height / timestamp `N` (BIP65).',
  },
  'tx.inputs': {
    code: 'Input[] tx.inputs',
    codeDesc: 'The list of inputs of the current transaction. Index into it with `tx.inputs[i]`.',
  },
  'tx.outputs': {
    code: 'Output[] tx.outputs',
    codeDesc: 'The list of outputs of the current transaction. Index into it with `tx.outputs[i]`.',
  },
  'tx.inputs.length': {
    code: 'int tx.inputs.length',
    codeDesc: 'The number of inputs in the current transaction.',
  },
  'tx.outputs.length': {
    code: 'int tx.outputs.length',
    codeDesc: 'The number of outputs in the current transaction.',
  },
  'tx.inputs[].value': {
    code: 'int tx.inputs[i].value',
    codeDesc: 'The value (in satoshis) of input `i`.',
  },
  'tx.inputs[].lockingBytecode': {
    code: 'bytes tx.inputs[i].lockingBytecode',
    codeDesc: 'The locking bytecode of the UTXO being spent by input `i`.',
  },
  'tx.inputs[].unlockingBytecode': {
    code: 'bytes tx.inputs[i].unlockingBytecode',
    codeDesc: 'The unlocking bytecode (scriptSig) of input `i`.',
  },
  'tx.inputs[].outpointTransactionHash': {
    code: 'bytes32 tx.inputs[i].outpointTransactionHash',
    codeDesc: 'The transaction hash of the outpoint being spent by input `i`.',
  },
  'tx.inputs[].outpointIndex': {
    code: 'int tx.inputs[i].outpointIndex',
    codeDesc: 'The output index of the outpoint being spent by input `i`.',
  },
  'tx.inputs[].sequenceNumber': {
    code: 'int tx.inputs[i].sequenceNumber',
    codeDesc: 'The sequence number of input `i`.',
  },
  'tx.inputs[].tokenCategory': {
    code: 'bytes tx.inputs[i].tokenCategory',
    codeDesc:
      'The token category (+ optional capability byte) of input `i`. Empty bytes if the input carries no tokens.',
  },
  'tx.inputs[].nftCommitment': {
    code: 'bytes tx.inputs[i].nftCommitment',
    codeDesc: 'The NFT commitment bytes of input `i`. Empty bytes if the input is not an NFT.',
  },
  'tx.inputs[].tokenAmount': {
    code: 'int tx.inputs[i].tokenAmount',
    codeDesc: 'The fungible token amount of input `i`. Zero if the input carries no fungible tokens.',
  },
  'tx.outputs[].value': {
    code: 'int tx.outputs[i].value',
    codeDesc: 'The value (in satoshis) of output `i`.',
  },
  'tx.outputs[].lockingBytecode': {
    code: 'bytes tx.outputs[i].lockingBytecode',
    codeDesc: 'The locking bytecode of output `i`.',
  },
  'tx.outputs[].tokenCategory': {
    code: 'bytes tx.outputs[i].tokenCategory',
    codeDesc:
      'The token category (+ optional capability byte) of output `i`. Empty bytes if the output carries no tokens.',
  },
  'tx.outputs[].nftCommitment': {
    code: 'bytes tx.outputs[i].nftCommitment',
    codeDesc: 'The NFT commitment bytes of output `i`. Empty bytes if the output is not an NFT.',
  },
  'tx.outputs[].tokenAmount': {
    code: 'int tx.outputs[i].tokenAmount',
    codeDesc: 'The fungible token amount of output `i`. Zero if the output carries no fungible tokens.',
  },
};

let MEMBERS: Data = {
  length: {
    code: 'int sequence.length',
    codeDesc: 'Returns the length of a bytes, string or array sequence.',
  },
  split: {
    code: '[s1, s2] sequence.split(int i)',
    codeDesc: 'Splits the sequence at the specified index and returns a tuple with the two resulting sequences.',
  },
  reverse: {
    code: 'any sequence.reverse()',
    codeDesc: 'Reverses the sequence.',
  },
  slice: {
    code: 'any sequence.slice(int start, int end)',
    codeDesc: 'Returns a new sequence containing the elements from `start` to `end`.',
  },
};

let TYPECASTS: Data = {
  int: {
    code: 'int int( v )',
    codeDesc: 'Converts to int',
  },
  string: {
    code: 'string string( v )',
    codeDesc: 'Converts to string',
  },
  bytes: {
    code: 'bytes bytes( v )',
    codeDesc: 'Converts to an unbounded bytes sequence.',
  },
  bytesN: {
    code: 'bytesN bytesN( v )',
    codeDesc: 'Converts to a bytes sequence of exactly N bytes. Fails at runtime if the value does not fit.',
  },
  bool: {
    code: 'bool bool( v )',
    codeDesc: 'Converts to bool. Integer values are coerced to 1 (truthy) or 0 (false).',
  },
  date: {
    code: 'int date(" YYYY-MM-DDThh:mm:ss ")',
    codeDesc: 'Converts implicit date to timestamp',
  },
  unsafe_int: {
    code: 'int unsafe_int( v )',
    codeDesc:
      'Unsafe cast to int: reinterprets the value without type enforcement at runtime. The caller is responsible for ensuring the value is a valid Script number.',
  },
  unsafe_bool: {
    code: 'bool unsafe_bool( v )',
    codeDesc:
      'Unsafe cast to bool: reinterprets the value without coercing to 1 / 0. The caller is responsible for ensuring the value is already a valid boolean.',
  },
  unsafe_bytes: {
    code: 'bytes unsafe_bytes( v )',
    codeDesc: 'Unsafe cast to unbounded bytes. No runtime length or type enforcement.',
  },
  unsafe_bytesN: {
    code: 'bytesN unsafe_bytesN( v )',
    codeDesc:
      'Unsafe cast to a bytes sequence of N bytes. Skips the runtime length check — the caller is responsible for guaranteeing the value is exactly N bytes.',
  },
  unsafe_byte: {
    code: 'bytes1 unsafe_byte( v )',
    codeDesc: 'Unsafe cast to a single byte. No runtime length enforcement.',
  },
};

let TYPES: Data = {
  int: {
    code: 'int',
    codeDesc: 'Signed integer type. Encoded as a Script Number on the stack.',
  },
  bool: {
    code: 'bool',
    codeDesc: 'Boolean type. Values are `true` or `false`.',
  },
  string: {
    code: 'string',
    codeDesc: 'UTF-8 string type. Encoded as bytes on the stack.',
  },
  bytes: {
    code: 'bytes',
    codeDesc: 'Unbounded bytes sequence.',
  },
  bytesN: {
    code: 'bytesN',
    codeDesc: 'Bytes sequence of exactly N bytes.',
  },
  pubkey: {
    code: 'pubkey',
    codeDesc: 'Public key type (compressed or uncompressed bytes).',
  },
  sig: {
    code: 'sig',
    codeDesc: 'Transaction signature type. Only valid as an argument to `checkSig` / `checkMultiSig`.',
  },
  datasig: {
    code: 'datasig',
    codeDesc: 'Data signature type. Only valid as an argument to `checkDataSig`.',
  },
};

let LANGUAGE: Data = {
  ...GLOBAL_FUNCTIONS,
  ...INSTANTIATIONS,
  ...STATEMENTS,
  ...DECLARATION_KEYWORDS,
  ...MODIFIERS,
  ...TYPECASTS,
  ...UNITS,
  ...INTROSPECTION,
  ...MEMBERS,
};

/**
 * Build a CompletionItem with `detail` / `documentation` sourced from the
 * matching `LANGUAGE` entry (so hover and completion surface the same info).
 */
function member(fullKey: string, label: string, kind: CompletionItemKind = CompletionItemKind.Field): CompletionItem {
  const entry = LANGUAGE[fullKey];
  return {
    label,
    kind,
    detail: entry?.code,
    documentation: entry?.codeDesc,
  };
}

let DOT_COMPLETIONS: { [key: string]: CompletionItem[] } = {
  tx: [
    member('tx.version', 'version'),
    member('tx.locktime', 'locktime'),
    member('tx.inputs', 'inputs'),
    member('tx.outputs', 'outputs'),
    member('tx.time', 'time'),
  ],

  inputs: [member('tx.inputs.length', 'length')],

  inputs_indexed: [
    member('tx.inputs[].value', 'value'),
    member('tx.inputs[].lockingBytecode', 'lockingBytecode'),
    member('tx.inputs[].outpointTransactionHash', 'outpointTransactionHash'),
    member('tx.inputs[].outpointIndex', 'outpointIndex'),
    member('tx.inputs[].unlockingBytecode', 'unlockingBytecode'),
    member('tx.inputs[].sequenceNumber', 'sequenceNumber'),
    member('tx.inputs[].tokenCategory', 'tokenCategory'),
    member('tx.inputs[].nftCommitment', 'nftCommitment'),
    member('tx.inputs[].tokenAmount', 'tokenAmount'),
  ],

  outputs: [member('tx.outputs.length', 'length')],

  outputs_indexed: [
    member('tx.outputs[].value', 'value'),
    member('tx.outputs[].lockingBytecode', 'lockingBytecode'),
    member('tx.outputs[].tokenCategory', 'tokenCategory'),
    member('tx.outputs[].nftCommitment', 'nftCommitment'),
    member('tx.outputs[].tokenAmount', 'tokenAmount'),
  ],

  this: [
    member('this.activeInputIndex', 'activeInputIndex'),
    member('this.activeBytecode', 'activeBytecode'),
    member('this.age', 'age'),
  ],

  console: [member('console.log', 'log', CompletionItemKind.Method)],
};

export { GLOBAL_FUNCTIONS, INSTANTIATIONS, TYPECASTS, TYPES, LANGUAGE, DOT_COMPLETIONS };
