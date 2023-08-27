import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/src/', '<rootDir>/test/', '<rootDir>/dist/tmp', '<rootDir>/.+.ts'],
  moduleNameMapper: {
    '@src/(.+)': '<rootDir>/dist/$1',
    '@ditsmod/core': '<rootDir>/../../packages/core/dist',
    '@ditsmod/testing': '<rootDir>/../../packages/testing/dist',
    '@ditsmod/i18n': '<rootDir>/../../packages/i18n/dist',
    '@ditsmod/router': '<rootDir>/../../packages/router/dist',
    '@dict/first/(.+)': '<rootDir>/dist/app/first/locales/current/_base-en/$1',
    '@dict/second/(.+)': '<rootDir>/dist/app/second/locales/current/_base-en/$1',
  },
};

export default config;
