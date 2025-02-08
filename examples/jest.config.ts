import type { Config } from 'jest';

const config: Config = {
  transform: {},
  moduleFileExtensions: ['js'],
  testEnvironment: 'node',
  modulePathIgnorePatterns: [],
  projects: ['<rootDir>/*/jest.config.ts'],
};

export default config;
