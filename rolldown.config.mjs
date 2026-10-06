import { defineConfig } from 'rolldown';

const minify = process.env.MINIFY === 'true';

const shared = {
  platform: 'node',
  output: {
    dir: 'dist',
    minify,
    sourcemap: !minify,
  },
};

export default defineConfig([
  // The client entry stays CJS so the extension also loads in hosts without ESM
  // extension support (e.g. Cursor)
  {
    ...shared,
    input: { extension: 'src/extension.ts' },
    // Provided by the VS Code extension host at runtime
    external: ['vscode'],
    output: { ...shared.output, format: 'cjs' },
  },
  // The language server runs as a plain forked Node process, so it can be ESM —
  // required because @bitauth/libauth (via cashc) uses top-level await
  {
    ...shared,
    input: { server: 'src/server.ts' },
    output: {
      ...shared.output,
      format: 'es',
      // cashc names its errors and warnings after their class (e.g. 'UnusedVariableWarning'),
      // which the linter relies on, so minification must not rename classes
      keepNames: true,
      entryFileNames: '[name].mjs',
      chunkFileNames: '[name]-[hash].mjs',
    },
  },
]);
