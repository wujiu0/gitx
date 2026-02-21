import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/extension.ts'],
  format: 'esm',
  outDir: 'out',
  platform: 'node',
  target: 'es2022',
  fixedExtension: false,
  sourcemap: false,
  clean: true,
  external: ['vscode'],
});
