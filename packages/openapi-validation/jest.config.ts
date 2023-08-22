import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/src/'],
  moduleNameMapper: {
    '@ditsmod/core': '<rootDir>/../core/dist/src',
    '@ditsmod/openapi': '<rootDir>/../openapi/dist/src',
    '@ditsmod/i18n': '<rootDir>/../i18n/dist/src'
  }
};

export default config;
