import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/src/', '<rootDir>/e2e/', '<rootDir>/dist/tmp'],
  setupFilesAfterEnv: ['reflect-metadata/lite'],
};

export default config;
