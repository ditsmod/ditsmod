import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/src/', '<rootDir>/test/', '<rootDir>/dist/tmp'],
  moduleNameMapper: {
    '@src/(.+)': '<rootDir>/dist/$1',
    '@ditsmod/core': '<rootDir>/../../packages/core/dist',
    '@ditsmod/testing': '<rootDir>/../../packages/testing/dist',
    '@ditsmod/router': '<rootDir>/../../packages/router/dist',
    '@ditsmod/i18n': '<rootDir>/../../packages/i18n/dist',
    '@ditsmod/openapi-validation': '<rootDir>/../../packages/openapi-validation/dist',
    '@ditsmod/openapi': '<rootDir>/../../packages/openapi/dist',
    '@ditsmod/body-parser': '<rootDir>/../../packages/body-parser/dist',
  },
};

export default config;
