import type { JestConfigWithTsJest } from 'ts-jest';

// This config is used `ts-jest` to work with TypeScript tests.
// See https://kulshekhar.github.io/ts-jest/docs/guides/esm-support/
const config: JestConfigWithTsJest = {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  modulePathIgnorePatterns: [],
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
