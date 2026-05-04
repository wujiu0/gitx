import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/extension.ts'],
  format: 'esm',
  outDir: 'out',
  platform: 'node',
  target: 'es2022',
  fixedExtension: false,
  sourcemap: true,
  clean: true,
  external: ['vscode'],
});
