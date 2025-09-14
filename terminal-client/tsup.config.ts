import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/cli.tsx'],
    format: ['esm'],
    target: 'node18',
    outDir: 'dist',
    clean: true,
    minify: false,
    sourcemap: true,
    shims: true,
    esbuildOptions(options) {
        options.jsx = 'automatic';
    },
});
