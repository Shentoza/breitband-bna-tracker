import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    target: 'node24',
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'index.js'),
      formats: ['cjs']
    },
    rollupOptions: {
      external: [
        // treat system modules and dependencies as external to keep bundle small
      ]
    }
  }
});
