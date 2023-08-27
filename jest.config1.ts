import type { JestConfigWithTsJest } from 'ts-jest';

// This config is used `ts-jest` to work with TypeScript tests.
// See https://kulshekhar.github.io/ts-jest/docs/guides/esm-support/
const config: JestConfigWithTsJest = {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  modulePathIgnorePatterns: [],
  moduleNameMapper: {
    '@ditsmod/body-parser': '<rootDir>/packages/body-parser/src',
    '@ditsmod/core': '<rootDir>/packages/core/src',
    '@ditsmod/openapi': '<rootDir>/packages/openapi/src',
    '@ditsmod/router': '<rootDir>/packages/router/src',
    '@ditsmod/session-cookie': '<rootDir>/packages/session-cookie/src',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
};

export default config;
