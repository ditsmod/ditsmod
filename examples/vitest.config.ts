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
    include: ['examples/*/dist/**/*.spec.js'],
    exclude: ['**/node_modules/**'],
    env: {
      ...config({ path: 'examples/03-route-guards/.env' }).parsed,
    },
    watch: false
  },
});
