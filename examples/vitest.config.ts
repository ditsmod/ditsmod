import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';
import * as path from 'path';

const dotenvPath1 = path.resolve('examples/03-route-guards/.env');
const output1 = config({ path: dotenvPath1 });
if (output1.error) {
  throw output1.error;
}

const dotenvPath2 = path.resolve('examples/20-authjs/.env');
const output2 = config({ path: dotenvPath2 });
if (output2.error) {
  throw output2.error;
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
    watch: false
  },
});
