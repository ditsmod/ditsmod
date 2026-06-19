// @ts-check

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    rules: {
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 1,
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/consistent-type-imports': 1,
      '@typescript-eslint/no-empty-object-type': 0,
      '@typescript-eslint/no-non-null-assertion': 0,
      '@typescript-eslint/no-empty-function': 0,
      '@typescript-eslint/no-empty-interface': 0,
      '@typescript-eslint/explicit-function-return-type': 0,
      '@typescript-eslint/explicit-module-boundary-types': 0,
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/no-inferrable-types': 0,
      '@typescript-eslint/no-non-null-asserted-optional-chain': 0,
      '@typescript-eslint/no-unused-vars': 0,
      '@typescript-eslint/triple-slash-reference': 0,
      '@typescript-eslint/no-unsafe-function-type': 0,
      'no-unused-private-class-members': 'warn',
      'no-useless-assignment': 'warn',
      'no-restricted-imports': ['error', 'fs'],
      'prefer-const': 'warn',
      'no-async-promise-executor': 0,
      'no-prototype-builtins': 0,
    },
  },
  {
    ignores: [
      '**/dist*',
      '**/*.d.ts',
      'website/*',
      'node_modules/*',
      'eslint.config.mjs',
      '**/jest.config.ts',
      '**/vitest.config.ts',
      '**/jest.setup.js',
      '**/jest.d.ts',
      '**/jest.matchers.ts',
      'packages/openapi/ui/*',
    ],
  },
]);
