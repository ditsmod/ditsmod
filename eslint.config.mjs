// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: [
          './packages/*/tsconfig.json',
          './examples/*/tsconfig.json',
        ]
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 0,
      '@typescript-eslint/no-empty-object-type': 0,
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
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
      '@typescript-eslint/ban-types': 0,
      'no-async-promise-executor': 0,
      'no-prototype-builtins': 0,
    },
  },
  {
    ignores: [
      'node_modules/*',
      'packages/versions/*',
      'website/*',
      '**/dist*',
      'coverage/*',
      '**/*.d.ts',
      'eslint.config.mjs',
      '**/jest.config.ts',
      '**/*.spec.ts',
      'packages/openapi/src/swagger-ui/swagger.config.ts',
    ],
  },
);
