module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  moduleNameMapper: {
    '@ditsmod/core': '<rootDir>/../core/src',
    '@ditsmod/openapi': '<rootDir>/../openapi/src',
    '@ditsmod/i18n': '<rootDir>/../i18n/src'
  }
};
