import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    passWithNoTests: true,
    clearMocks: true,
    include: [
      'packages/authjs/dist*/**/*.spec.js',
    ],
    exclude: ['**/node_modules/**'],
    watch: false
  },
});
