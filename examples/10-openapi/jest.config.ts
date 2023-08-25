import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/src/', '<rootDir>/test/', '<rootDir>/dist/tmp'],
  moduleNameMapper: {
    '@ditsmod/core': '<rootDir>/../../packages/core/dist/src',
    '@ditsmod/router': '<rootDir>/../../packages/router/dist/src',
    '@ditsmod/openapi': '<rootDir>/../../packages/openapi/dist/src',
    '@ditsmod/jwt': '<rootDir>/../../packages/jwt/dist/src',
  },
};

export default config;
