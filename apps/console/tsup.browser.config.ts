import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/browser/main.tsx'],
  format: ['esm'],
  platform: 'browser',
  target: 'es2022',
  outDir: 'dist/browser',
  minify: true,
  dts: false,
  clean: true,
  splitting: false,
  noExternal: [/.*/],
});
