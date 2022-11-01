module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>.+dist/.+', '<rootDir>/packages/logger/*'],
  moduleNameMapper: {
    '@ditsmod/body-parser': '<rootDir>/packages/body-parser/src',
    '@ditsmod/core': '<rootDir>/packages/core/src',
    '@ditsmod/openapi': '<rootDir>/packages/openapi/src',
    '@ditsmod/router': '<rootDir>/packages/router/src',
    '@ditsmod/session-cookie': '<rootDir>/packages/session-cookie/src',
  },
  projects: ['<rootDir>/packages/*/jest.config.ts'],
};
