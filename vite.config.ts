import { defineConfig } from 'vite';
import { resolve } from 'path';
import { builtinModules } from 'module';
import pkg from './package.json';

const deps = Object.keys(pkg.dependencies || {});

function makeExternalPredicate(deps: string[]) {
  if (deps.length === 0) {
    return () => false;
  }
  const pattern = new RegExp(`^(${deps.join('|')})(/|$)`);
  return (id: string) => pattern.test(id) || id.startsWith('node:') || builtinModules.includes(id as string);
}

export default defineConfig({
  build: {
    target: 'node24',
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src', 'index.ts'),
      formats: ['es']
    },
    rollupOptions: {
      external: makeExternalPredicate(deps)
    }
  }
});
