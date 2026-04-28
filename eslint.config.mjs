import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
        parser: typescriptParser,
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
            setTimeout: 'readonly',
            clearTimeout: 'readonly',
            fetch: 'readonly',
            Request: 'readonly',
            Response: 'readonly',
            Headers: 'readonly',
            HeadersInit: 'readonly',
            RequestInit: 'readonly',
            AbortSignal: 'readonly',
            crypto: 'readonly',
            TextEncoder: 'readonly',
            File: 'readonly',
            FormData: 'readonly',
            performance: 'readonly',
            NodeJS: 'readonly',
            localStorage: 'readonly',
            sessionStorage: 'readonly',
        },
    },
    plugins: {
        '@typescript-eslint': typescriptEslint,
        'react': reactPlugin,
        'react-hooks': reactHooksPlugin,
        '@next/next': nextPlugin,
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
    rules: {
        ...typescriptEslint.configs.recommended.rules,
        ...reactPlugin.configs.recommended.rules,
        ...reactHooksPlugin.configs.recommended.rules,
        ...nextPlugin.configs.recommended.rules,
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'no-console': 'off',
        '@next/next/no-img-element': 'warn',
        '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'public/sw.js',
      'public/workbox-*.js',
      'backend/**',
    ],
  },
];
