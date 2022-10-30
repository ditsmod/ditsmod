module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  moduleNameMapper: {
    '@ditsmod/core': '<rootDir>/../packages/core/src',
    '@ditsmod/router': '<rootDir>/../packages/router/src',
  },
};
