import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    passWithNoTests: true,
    clearMocks: true,
    include: [
      './dist/**/*.spec.js',
      // './dist-e2e/**/*.spec.js', // For now, comment this becuse issue with `import.meta.resolve` , see https://github.com/vitest-dev/vitest/issues/6953
    ],
    exclude: ['**/node_modules/**'],
    watch: false
  },
});
