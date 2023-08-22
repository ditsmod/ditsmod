module.exports = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/src/'],
  moduleNameMapper: {
    '@ditsmod/core': '<rootDir>/../core/dist/src',
    '@ditsmod/router': '<rootDir>/../router/dist/src',
  }
};
