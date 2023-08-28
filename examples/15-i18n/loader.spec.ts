import { ModuleNameMap, getModuleNameMap, resolveAlias } from './loader.js';
import type { Config } from 'jest';

describe('Node.js loader', () => {
  let moduleNameMapper: Config['moduleNameMapper'];
  let moduleNameMap: ModuleNameMap;

  beforeAll(() => {
    moduleNameMapper = {
      '@src/(.+)': '<rootDir>/dist/$1',
      '@ditsmod/core': '<rootDir>/../../packages/core/dist',
      '@dict/first/(.+)': '<rootDir>/dist/app/$1',
      '@dict/second/(.+)': '<rootDir>/dist/app/$1',
    };
    moduleNameMap = [
      [/^@src\/(.+)/, '/srv/git/ditsmod/ditsmod/examples/15-i18n/dist/$1'],
      [/^@ditsmod\/core/, '/srv/git/ditsmod/ditsmod/examples/15-i18n/../../packages/core/dist'],
      [/^@dict\/first\/(.+)/, '/srv/git/ditsmod/ditsmod/examples/15-i18n/dist/app/$1'],
      [/^@dict\/second\/(.+)/, '/srv/git/ditsmod/ditsmod/examples/15-i18n/dist/app/$1'],
    ];
  });

  describe('getModuleNameMap()', () => {
    it('should be prepared ModuleNameMap', () => {
      expect(getModuleNameMap).not.toThrow();
      const rootDir = '/srv/git/ditsmod/ditsmod/examples/15-i18n/';
      const map = getModuleNameMap(moduleNameMapper, rootDir);
      expect(map).toEqual(moduleNameMap);
    });
  });

  describe('resolveAlias()', () => {
    it('should not to throw an error', () => {
      expect(() => resolveAlias([], '')).not.toThrow();
    });

    it('should resolved path without extension', () => {
      const alias = '@src/one/two';
      const expectedPath = '/srv/git/ditsmod/ditsmod/examples/15-i18n/dist/one/two/index.js';
      expect(resolveAlias(moduleNameMap, alias)).toBe(expectedPath);
    });

    it('should resolved path with ".mjs" extension', () => {
      const alias = '@dict/first/three/four.mjs';
      const expectedPath = '/srv/git/ditsmod/ditsmod/examples/15-i18n/dist/app/three/four.mjs';
      expect(resolveAlias(moduleNameMap, alias)).toBe(expectedPath);
    });

    it('should not be matched', () => {
      expect(resolveAlias(moduleNameMap, '')).toBe(false);
      expect(resolveAlias(moduleNameMap, '@src')).toBe(false);
      expect(resolveAlias(moduleNameMap, 'one/@src/two')).toBe(false);
    });
  });
});
