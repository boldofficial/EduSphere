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
      react: reactPlugin,
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
      // React Compiler advisories: existing code is correct at runtime but not compiler-optimisable.
      // Kept visible as warnings and tracked in docs/CODE_REVIEW_2026-10.md.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
  // Design-system guardrails for app screens (see docs/MODULE_AUDIT_2026-10.md, section 4).
  {
    files: ['components/**/*.tsx', 'app/**/*.tsx'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'confirm', message: 'Use useConfirm() from components/ui/confirm-dialog.' },
        { name: 'alert', message: 'Use addToast() from useToast().' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'window', property: 'confirm', message: 'Use useConfirm().' },
        { object: 'window', property: 'alert', message: 'Use addToast().' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/text-.(6|7|8|9|10|11)px/]',
          message: 'Text below 12px is unreadable on phones; use text-xs or larger.',
        },
        {
          selector: 'TemplateElement[value.raw=/text-.(6|7|8|9|10|11)px/]',
          message: 'Text below 12px is unreadable on phones; use text-xs or larger.',
        },
        {
          selector:
            'Literal[value=/(bg|text|border|ring|from|to|via)-(slate|emerald|rose|yellow|sky|violet)-[0-9]/]',
          message: 'Use gray, green, red, amber, blue or purple (or success/warning/danger/info).',
        },
      ],
    },
  },
  // Printed documents and the marketing site keep their own type sizes and palettes.
  {
    files: [
      'components/features/grading/ReportCardTemplate.tsx',
      'components/features/id-cards/CardTemplates.tsx',
      'components/features/hr/PayslipDocument.tsx',
      'components/features/bursary/StudentInvoiceView.tsx',
      'components/features/bursary/InvoiceTemplate.tsx',
      'components/features/bursary/ReceiptTemplate.tsx',
      'components/features/landing/**/*.tsx',
      'components/features/landing-tenant/**/*.tsx',
      'components/features/*Landing*.tsx',
      'app/(marketing)/**/*.tsx',
      'app/*.tsx',
      'app/blog/**/*.tsx',
      'app/admission/**/*.tsx',
      'app/pay/**/*.tsx',
      'app/verify/**/*.tsx',
      'app/careers/**/*.tsx',
      'app/developers/**/*.tsx',
      'app/help/**/*.tsx',
      'app/privacy-policy/**/*.tsx',
      'app/resources/**/*.tsx',
      'app/success-stories/**/*.tsx',
      'app/terms-of-service/**/*.tsx',
    ],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    ignores: ['node_modules/**', '.next/**', 'public/sw.js', 'public/workbox-*.js', 'backend/**'],
  },
];
