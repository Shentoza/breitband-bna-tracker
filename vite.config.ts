import { defineConfig } from 'vite';
import { resolve } from 'path';
import { builtinModules } from 'module';
import pkg from './package.json';

const deps = Object.keys(pkg.dependencies || {});

export default defineConfig({
  build: {
    target: 'node24',
    outDir: 'dist',
    ssr: true, // Server-side rendering mode for Node.js
    lib: {
      entry: resolve(__dirname, 'src', 'index.ts'),
      formats: ['es'],
      fileName: () => 'breitbandmessung-mqtt.js'
    },
    rollupOptions: {
      external: [...deps, ...builtinModules.map(m => `node:${m}`), ...builtinModules],
      output: {
        entryFileNames: 'breitbandmessung-mqtt.js',
        banner: '#!/usr/bin/env node\n' // Make it executable
      }
    },
    minify: 'esbuild', // Enable minification
    sourcemap: false
  }
});
