import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/src/', '<rootDir>/test/.+ts', '<rootDir>/dist/tmp'],
  moduleNameMapper: {
    '@ditsmod/core': '<rootDir>/../../packages/core/dist/src',
    '@ditsmod/router': '<rootDir>/../../packages/router/dist/src',
    '@ditsmod/return': '<rootDir>/../../packages/return/dist/src',
  },
};

export default config;
