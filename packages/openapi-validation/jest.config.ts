import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/src/'],
  moduleNameMapper: {
    '@ditsmod/core': '<rootDir>/../core/dist',
    '@ditsmod/openapi': '<rootDir>/../openapi/dist',
    '@ditsmod/i18n': '<rootDir>/../i18n/dist'
  }
};

export default config;
