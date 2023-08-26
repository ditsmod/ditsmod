import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/src/', '<rootDir>/test/'],
  moduleNameMapper: {
    '@src/(.+)': '<rootDir>/dist/$1',
    '@ditsmod/core': '<rootDir>/../core/dist',
    '@ditsmod/router': '<rootDir>/../router/dist',
  },
};

export default config;
