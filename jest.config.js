module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>.+dist/.+'],
  moduleNameMapper: {
    '@ditsmod/body-parser': '<rootDir>/packages/body-parser/src',
    '@ditsmod/core': '<rootDir>/packages/core/src',
    '@ditsmod/openapi': '<rootDir>/packages/openapi/src',
    '@ditsmod/router': '<rootDir>/packages/router/src',
  }
};