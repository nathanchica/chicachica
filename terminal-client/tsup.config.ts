import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/cli.tsx'],
    format: ['esm'],
    target: 'node18',
    splitting: false,
    sourcemap: true,
    clean: true,
    shims: true,
    banner: {
        js: '#!/usr/bin/env node',
    },
    esbuildOptions(options) {
        options.platform = 'node';
    },
});
