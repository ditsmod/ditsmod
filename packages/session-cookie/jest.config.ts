import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/src/'],
  setupFilesAfterEnv: ['reflect-metadata/lite'],
};

export default config;
