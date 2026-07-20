import { loadEnvFile } from 'node:process';
import path from 'node:path';
import fs from 'node:fs';
import type { Config } from 'jest';

const envPath = path.resolve(import.meta.dirname, '.env');
if (fs.existsSync(envPath)) {
  loadEnvFile(envPath);
}

const config: Config = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/src/', '<rootDir>/e2e/', '<rootDir>/dist/tmp'],
  setupFilesAfterEnv: ['reflect-metadata/lite'],
};

export default config;
