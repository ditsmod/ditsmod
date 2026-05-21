import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/src/', '<rootDir>/e2e/'],
  setupFilesAfterEnv: ['reflect-metadata/lite'],
};

export default config;
