import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    passWithNoTests: true,
    clearMocks: true,
    include: [
      'packages/*/dist/**/*.spec.js',
    ],
    exclude: ['**/node_modules/**'],
    watch: false
  },
});
