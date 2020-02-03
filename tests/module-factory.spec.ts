import { ModuleFactory } from '../src/module-factory';
import { ModuleType } from '../src/types/types';
import { NormalizedProvider } from '../src/utils/ng-utils';
import { Module } from '../src/types/decorators';
import { defaultProvidersPerReq } from '../src/types/default-options';

describe('ModuleFactory', () => {
  class MockModuleFactory extends ModuleFactory {
    getRawModuleMetadata(mod: ModuleType) {
      return super.getRawModuleMetadata(mod);
    }

    mergeMetadata(mod: ModuleType) {
      return super.mergeMetadata(mod);
    }

    importProviders(mod: ModuleType, soughtProvider?: NormalizedProvider) {
      return super.importProviders(mod, soughtProvider);
    }

    setRoutes() {
      super.setRoutes();
    }
  }

  let mock: MockModuleFactory;
  beforeEach(() => {
    mock = new MockModuleFactory(null, null, null);
  });

  class ClassWithoutDecorators {}
  class SomeControllerClass {}

  describe('getRawModuleMetadata()', () => {
    it('should returns ClassWithDecorators metadata', () => {
      @Module({ controllers: [SomeControllerClass] })
      class ClassWithDecorators {}
      const metadata = mock.getRawModuleMetadata(ClassWithDecorators);
      expect(metadata).toEqual(new Module({ controllers: [SomeControllerClass] }));
    });

    it('should not returns any metadata', () => {
      const metadata = mock.getRawModuleMetadata(ClassWithoutDecorators);
      expect(metadata).toBeUndefined();
    });
  });

  describe('mergeMetadata()', () => {
    it('should set default metatada', () => {
      @Module()
      class ClassWithDecorators {}
      const metadata = mock.mergeMetadata(ClassWithDecorators);
      expect(metadata.controllers).toEqual([]);
      expect(metadata.exports).toEqual([]);
      expect(metadata.imports).toEqual([]);
      expect(metadata.providersPerMod).toEqual([]);
      expect(metadata.providersPerReq).toEqual(defaultProvidersPerReq);
    });

    it('should merge default metatada with ClassWithDecorators metadata', () => {
      @Module({
        controllers: [SomeControllerClass],
        providersPerReq: [ClassWithoutDecorators]
      })
      class ClassWithDecorators {}
      const metadata = mock.mergeMetadata(ClassWithDecorators);
      expect(metadata.controllers).toEqual([SomeControllerClass]);
      expect(metadata.exports).toEqual([]);
      expect(metadata.imports).toEqual([]);
      expect(metadata.providersPerMod).toEqual([]);
      expect(metadata.providersPerReq).toEqual([...defaultProvidersPerReq, ClassWithoutDecorators]);
    });

    it('ClassWithoutDecorators should not have metatada', () => {
      const msg = `Module build failed: module "ClassWithoutDecorators" does not have the "@Module()" decorator`;
      expect(() => mock.mergeMetadata(ClassWithoutDecorators)).toThrowError(msg);
    });
  });

  describe('importProviders()', () => {
    it('should', () => {});
  });

  describe('setRoutes()', () => {});
});
