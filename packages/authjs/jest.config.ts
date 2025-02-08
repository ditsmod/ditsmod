import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/src/'],
  setupFiles: ['<rootDir>/dist-e2e/test-setup.js']
};

export default config;
