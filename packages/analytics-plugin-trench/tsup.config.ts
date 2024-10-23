import { defineConfig, Options } from 'tsup';

const commonConfig: Options = {
  minify: true,
  dts: true, // Generate type declarations
  format: ['esm', 'cjs'],
  sourcemap: true, // Enable source maps for debugging
  clean: true, // Clean the output directory before building
  noExternal: [/(.*)/], // Bundle all dependencies, including local packages
};

export default defineConfig([
  {
    ...commonConfig,
    entry: ['src/index.ts'], // Main entry point of the package
    outDir: 'dist', // Output directory
  },
]);
