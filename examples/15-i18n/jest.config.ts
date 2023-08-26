import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/src/', '<rootDir>/test/', '<rootDir>/dist/tmp'],
  moduleNameMapper: {
    '@src/(.+)': '<rootDir>/dist/$1',
    '@ditsmod/core': '<rootDir>/../../packages/core/dist',
    '@ditsmod/testing': '<rootDir>/../../packages/testing/dist',
    '@ditsmod/i18n': '<rootDir>/../../packages/i18n/dist',
    '@ditsmod/router': '<rootDir>/../../packages/router/dist',
    '@dict/first/first.dict': '<rootDir>/dist/app/first/locales/current/_base-en/first.dict',
    '@dict/second/second.dict': '<rootDir>/dist/app/second/locales/current/_base-en/second.dict',
    '@dict/second/errors.dict': '<rootDir>/dist/app/second/locales/current/_base-en/errors.dict',
  },
};

export default config;
