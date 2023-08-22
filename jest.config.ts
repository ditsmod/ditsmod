import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js'],
  testEnvironment: 'node',
  modulePathIgnorePatterns: [],
  moduleNameMapper: {
    '@ditsmod/body-parser': '<rootDir>/packages/body-parser/dist/src',
    '@ditsmod/core': '<rootDir>/packages/core/dist/src',
    '@ditsmod/openapi': '<rootDir>/packages/openapi/dist/src',
    '@ditsmod/router': '<rootDir>/packages/router/dist/src',
    '@ditsmod/session-cookie': '<rootDir>/packages/session-cookie/dist/src',
  },
  projects: ['<rootDir>/packages/*/jest.config.ts'],
};

export default config;
