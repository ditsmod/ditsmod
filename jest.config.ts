import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js'],
  testEnvironment: 'node',
  modulePathIgnorePatterns: [],
  projects: ['<rootDir>/packages/*/jest.config.ts'],
  setupFilesAfterEnv: ['reflect-metadata/lite'],
};

export default config;
