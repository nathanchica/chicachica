import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';

export default [
    // Base JavaScript configuration
    js.configs.recommended,

    // Prettier config to disable conflicting rules
    prettierConfig,

    // Global ignores
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.next/**',
            '**/coverage/**',
            '**/*.min.js',
            'eslint.config.js',
            '**/*.config.js',
            '**/*.config.ts',
            '**/vite.config.ts',
            '.husky/**',
        ],
    },

    // TypeScript files configuration
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                exports: 'writable',
                module: 'writable',
                require: 'readonly',
                global: 'readonly',
                document: 'readonly',
                window: 'readonly',
                navigator: 'readonly',
                fetch: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
                React: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
            import: importPlugin,
        },
        rules: {
            ...tseslint.configs.recommended.rules,
            ...reactPlugin.configs.recommended.rules,
            ...reactHooksPlugin.configs.recommended.rules,

            // React specific
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/display-name': 'off',

            // TypeScript specific
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/no-explicit-any': 'warn',

            // General rules
            'no-console': 'off',
            'no-debugger': 'error',
            'no-unused-vars': 'off', // Handled by @typescript-eslint/no-unused-vars

            // Import ordering
            'import/order': [
                'warn',
                {
                    groups: ['builtin', 'external', 'internal', 'sibling', 'parent', 'index'],
                    'newlines-between': 'always',
                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: false,
                    },
                    pathGroups: [
                        {
                            pattern: 'react',
                            group: 'external',
                            position: 'before',
                        },
                        {
                            pattern: 'react-dom/**',
                            group: 'external',
                            position: 'before',
                        },
                    ],
                    pathGroupsExcludedImportTypes: ['react'],
                },
            ],
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },

    // JavaScript files configuration
    {
        files: ['**/*.js', '**/*.jsx'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                exports: 'writable',
                module: 'writable',
                require: 'readonly',
                global: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
        },
    },
];
