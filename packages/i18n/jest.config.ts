import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/src/'],
  moduleNameMapper: {
    '@ditsmod/core': '<rootDir>/../core/dist/src',
  },
};

export default config;
