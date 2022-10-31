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
    '@ditsmod/i18n': '<rootDir>/../packages/i18n/src',
    "@dict/first/first.dict": '<rootDir>/15-i18n/src/app/first/locales/current/_base-en/first.dict',
    "@dict/second/second.dict": '<rootDir>/15-i18n/src/app/second/locales/current/_base-en/second.dict',
    "@dict/second/errors.dict": '<rootDir>/15-i18n/src/app/second/locales/current/_base-en/errors.dict',
  },
};
