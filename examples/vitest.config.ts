import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';
import * as path from 'path';

const dotenvPath = path.resolve('examples/03-route-guards/.env');
const output = config({ path: dotenvPath });
if (output.error) {
  throw output.error;
}

export default defineConfig({
  test: {
    environment: 'node',
    passWithNoTests: true,
    clearMocks: true,
    include: ['examples/*/dist*/**/*.spec.js'],
    exclude: [
      '**/node_modules/**',
      // For now, comment this becuse there is an issue with `import.meta.resolve`, see https://github.com/vitest-dev/vitest/issues/6953
      'examples/10-openapi/dist-e2e/**/*.spec.js',
      'examples/16-openapi-validation/dist-e2e/**/*.spec.js',
    ],
    env: {
      ...config({ path: 'examples/03-route-guards/.env' }).parsed,
    },
    watch: false
  },
});
