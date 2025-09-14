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
    banner: {
        js: '#!/usr/bin/env node',
    },
    esbuildOptions(options) {
        options.jsx = 'automatic';
    },
});
