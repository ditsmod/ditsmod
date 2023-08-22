import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/src/', '<rootDir>/test/.+ts'],
  moduleNameMapper: {
    '@ditsmod/core': '<rootDir>/../core/dist/src',
    '@ditsmod/router': '<rootDir>/../router/dist/src',
  },
};

export default config;
