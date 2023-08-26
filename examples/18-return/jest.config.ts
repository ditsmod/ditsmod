import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/src/', '<rootDir>/test/', '<rootDir>/dist/tmp'],
  moduleNameMapper: {
    '@src/(.+)': '<rootDir>/dist/$1',
    '@ditsmod/core': '<rootDir>/../../packages/core/dist',
    '@ditsmod/testing': '<rootDir>/../../packages/testing/dist',
    '@ditsmod/router': '<rootDir>/../../packages/router/dist',
    '@ditsmod/return': '<rootDir>/../../packages/return/dist',
  },
};

export default config;
