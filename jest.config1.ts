import type { Config } from 'jest';

// This config is used `ts-jest` to work with TypeScript tests.
const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: [],
  moduleNameMapper: {
    '@ditsmod/body-parser': '<rootDir>/packages/body-parser/src',
    '@ditsmod/core': '<rootDir>/packages/core/src',
    '@ditsmod/openapi': '<rootDir>/packages/openapi/src',
    '@ditsmod/router': '<rootDir>/packages/router/src',
    '@ditsmod/session-cookie': '<rootDir>/packages/session-cookie/src',
  }
};

export default config;
