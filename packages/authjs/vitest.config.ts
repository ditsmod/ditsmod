import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    passWithNoTests: true,
    clearMocks: true,
    include: [
      './dist*/**/*.spec.js',
    ],
    setupFiles: ['./dist-e2e/test-setup.js'],
    exclude: ['**/node_modules/**'],
    watch: true
  },
});
