module.exports = {
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/src/', '<rootDir>/test/.+ts'],
  moduleNameMapper: {
    '@ditsmod/core': '<rootDir>/../core/dist/src',
    '@ditsmod/router': '<rootDir>/../router/dist/src',
  },
};
