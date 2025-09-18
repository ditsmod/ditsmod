import { reflector } from '#di';
import { featureModule } from '#decorators/feature-module.js';
import { isFeatureModule, isModuleWithParams, isRootModule } from '#decorators/type-guards.js';
import { rootModule } from '#decorators/root-module.js';
import { ModuleWithParams } from '#decorators/module-raw-metadata.js';
import { ModuleNormalizer } from '#init/module-normalizer.js';
import { ModRefId } from '#types/mix.js';

describe('type guards', () => {
  describe('isModule()', () => {
    it('class with decorator', () => {
      @featureModule({})
      class Module1 {}
      const metadata = reflector.getDecorators(Module1)![0];
      expect(isFeatureModule(metadata)).toBe(true);
    });

    it('class without decorator', () => {
      class Module1 {}
      const metadata = reflector.getMetadata(Module1) as any;
      expect(isFeatureModule(metadata)).toBe(false);
    });
  });

  describe('isRootModule()', () => {
    it('class with decorator', () => {
      @rootModule({})
      class Module1 {}
      const metadata = reflector.getDecorators(Module1)![0];
      expect(isRootModule(metadata)).toBe(true);
    });

    it('class without decorator', () => {
      class Module1 {}
      const metadata = reflector.getMetadata(Module1) as any;
      expect(isRootModule(metadata)).toBe(false);
    });
  });

  describe('isRootModule()', () => {
    it('class with decorator', () => {
      @rootModule({})
      class Module1 {}
      const rawMeta = reflector.getDecorators(Module1, isRootModule)!;
      expect(rawMeta).toBeDefined();
    });

    it('class without decorator', () => {
      class MockModuleNormalizer extends ModuleNormalizer {
        override getDecoratorMeta(modRefId: ModRefId) {
          return super.getDecoratorMeta(modRefId);
        }
      }
      const mockModuleNormalizer = new MockModuleNormalizer();
      const getModuleMetadata = mockModuleNormalizer.getDecoratorMeta.bind(mockModuleNormalizer);
      class Module1 {}
      const rawMeta = getModuleMetadata(Module1)!;
      expect(rawMeta).toBeUndefined();
    });
  });

  describe('isModuleWithParams', () => {
    it('module without params', () => {
      @featureModule({})
      class Module1 {}

      expect(isModuleWithParams(Module1)).toBe(false);
    });

    it('module with params', () => {
      @featureModule({})
      class Module1 {
        static withParams(): ModuleWithParams<Module1> {
          return {
            module: Module1,
            providersPerMod: [],
          };
        }
      }

      const modObj = Module1.withParams();
      expect(isModuleWithParams(modObj)).toBe(true);
    });
  });
});
