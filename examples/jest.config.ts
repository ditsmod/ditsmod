module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  moduleNameMapper: {
    '@ditsmod/core': '<rootDir>/../packages/core/src',
    '@ditsmod/router': '<rootDir>/../packages/router/src',
    '@ditsmod/body-parser': '<rootDir>/../packages/body-parser/src',
    '@ditsmod/openapi': '<rootDir>/../packages/openapi/src',
    '@ditsmod/jwt': '<rootDir>/../packages/jwt/src',
  },
};
