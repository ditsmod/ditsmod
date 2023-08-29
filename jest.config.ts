import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js'],
  testEnvironment: 'node',
  modulePathIgnorePatterns: [],
  projects: ['<rootDir>/packages/*/jest.config.ts'],
};

export default config;
