import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/src/', '<rootDir>/test/.+ts', '<rootDir>/dist/tmp'],
  moduleNameMapper: {
    '@ditsmod/core': '<rootDir>/../../packages/core/dist/src',
    '@ditsmod/router': '<rootDir>/../../packages/router/dist/src',
    '@dict/first/first.dict': '<rootDir>/dist/src/app/first/locales/current/_base-en/first.dict',
    '@dict/second/second.dict': '<rootDir>/dist/src/app/second/locales/current/_base-en/second.dict',
    '@dict/second/errors.dict': '<rootDir>/dist/src/app/second/locales/current/_base-en/errors.dict',
  },
};

export default config;
