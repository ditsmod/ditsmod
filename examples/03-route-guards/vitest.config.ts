import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';
import * as path from 'path';

const dotenvPath = path.resolve('.env');
const output = config({ path: dotenvPath });
if (output.error) {
  throw output.error;
}

export default defineConfig({
  test: {
    passWithNoTests: true,
    clearMocks: true,
    include: ['./dist*/**/*.spec.js'],
    exclude: ['**/node_modules/**'],
    watch: true,
  },
});