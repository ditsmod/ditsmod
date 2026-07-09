import { featureModule } from '#decorators/feature-module.js';
import { isFeatureModule, isModuleWithParams, isRootModule } from '#decorators/type-guards.js';
import { rootModule } from '#decorators/root-module.js';
import { ModuleDecoratorOptions, ModuleWithParams } from '#decorators/module-decorator-options.js';
import { BaseMeta } from '#init/base-meta.js';
import { InitHooks } from './init-hooks-and-metadata.js';
import { Reflector } from '#di/reflector.js';
import { DecoratorAndValue } from '#di/top/decorator-and-value.js';

describe('type guards', () => {
  describe('isFeatureModule()', () => {
    it('class without decorator', () => {
      class Module1 {}
      const metadata = Reflector.collectMeta(Module1);
      expect(isFeatureModule(metadata)).toBe(false);
    });

    it('DecoratorAndValue', () => {
      @featureModule()
      class Module1 {}
      const metadata = Reflector.getClassLevelMeta(Module1)![0];
      expect(isFeatureModule(metadata)).toBe(true);
    });

    it('initHooks in DecoratorAndValue false', () => {
      const initHooks = new InitHooks({});
      const decorAndVal = new DecoratorAndValue(featureModule, initHooks);
      expect(isFeatureModule(decorAndVal)).toBe(false);
    });

    it('initHooks in DecoratorAndValue true', () => {
      const initHooks = new InitHooks({});
      initHooks.moduleRole = 'feature';
      const decorAndVal = new DecoratorAndValue(featureModule, initHooks);
      expect(isFeatureModule(decorAndVal)).toBe(true);
    });

    it('BaseMeta true', () => {
      @featureModule()
      class Module1 {
        method1() {}
      }

      const baseMeta = new BaseMeta();
      const metadata = Reflector.getClassLevelMeta(Module1)![0];
      baseMeta.decoratorOptions = metadata.value;
      expect(isFeatureModule(baseMeta)).toBe(true);
    });

    it('BaseMeta false', () => {
      const baseMeta = new BaseMeta();
      baseMeta.decoratorOptions = {};
      expect(isFeatureModule(baseMeta)).toBe(false);
    });

    it('initHooks in BaseMeta false', () => {
      const initHooks = new InitHooks({});
      const baseMeta = new BaseMeta();
      baseMeta.decoratorOptions = initHooks;
      expect(isFeatureModule(baseMeta)).toBe(false);
    });

    it('initHooks in BaseMeta true', () => {
      const initHooks = new InitHooks({});
      initHooks.moduleRole = 'feature';
      const baseMeta = new BaseMeta();
      baseMeta.decoratorOptions = initHooks;
      expect(isFeatureModule(baseMeta)).toBe(true);
    });

    it('initHooks direct true', () => {
      const initHooks = new InitHooks({});
      initHooks.moduleRole = 'feature';
      expect(isFeatureModule(initHooks)).toBe(true);
    });

    it('initHooks direct false', () => {
      const initHooks = new InitHooks({});
      expect(isFeatureModule(initHooks)).toBe(false);
    });

    it('ModuleDecoratorOptions', () => {
      expect(isFeatureModule(new ModuleDecoratorOptions())).toBe(true);
    });
  });

  describe('isRootModule()', () => {
    it('class with decorator', () => {
      @rootModule({})
      class Module1 {}
      const decoratorOptions = Reflector.getClassLevelMeta(Module1, isRootModule);
      expect(decoratorOptions).toBeDefined();
    });

    it('class without decorator', () => {
      class Module1 {}
      const metadata = Reflector.collectMeta(Module1);
      expect(isRootModule(metadata)).toBe(false);
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
