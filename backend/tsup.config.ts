import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  outDir: 'dist',
  format: ['cjs'],

  // Performance & Size Optimizations
  minify: true,              // Minify output (reduces size significantly)
  treeshake: true,           // Remove unused code (default: true)
  splitting: false,          // Keep as single file for Node.js
  
  // Source Maps
  sourcemap: true,           // Generate source maps for debugging production
  
  // Type Declarations
  dts: true,                 // Generate .d.ts files
  
  // Bundle Options
  bundle: true,              // Bundle dependencies (default: true)
  clean: true,               // Clean output before build
  
  // Node.js Specific
  platform: 'node',          // Optimize for Node.js


  external: ['@prisma/client'],
});
