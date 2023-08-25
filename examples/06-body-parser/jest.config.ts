import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/src/', '<rootDir>/test/', '<rootDir>/dist/tmp'],
  moduleNameMapper: {
    '@ditsmod/core': '<rootDir>/../../packages/core/dist/src',
    '@ditsmod/router': '<rootDir>/../../packages/router/dist/src',
    '@ditsmod/body-parser': '<rootDir>/../../packages/body-parser/dist/src',
  },
};

export default config;
