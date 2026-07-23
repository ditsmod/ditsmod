import { featureModule } from '#decorators/feature-module.js';
import { isFeatureModule, isDynamicModule, isRootModule } from '#decorators/type-guards.js';
import { rootModule } from '#decorators/root-module.js';
import { FeatureModuleOptions, DynamicModule } from '#decorators/module-decorator-options.js';
import { NormalizedModuleMeta } from '#init/normalized-meta.js';
import { InitHooks } from './init-hooks-and-metadata.js';
import { Reflector } from '#di/reflector.js';
import { DecoratorMeta } from '#di/top/decorator-and-value.js';

describe('type guards', () => {
  describe('isFeatureModule()', () => {
    it('class without decorator', () => {
      class Module1 {}
      const metadata = Reflector.collectMeta(Module1);
      expect(isFeatureModule(metadata)).toBe(false);
    });

    it('DecoratorMeta', () => {
      @featureModule()
      class Module1 {}
      const metadata = Reflector.getClassLevelMeta(Module1)![0];
      expect(isFeatureModule(metadata)).toBe(true);
    });

    it('initHooks in DecoratorMeta false', () => {
      const initHooks = new InitHooks({});
      const decorAndVal = new DecoratorMeta(featureModule, initHooks);
      expect(isFeatureModule(decorAndVal)).toBe(false);
    });

    it('initHooks in DecoratorMeta true', () => {
      const initHooks = new InitHooks({});
      initHooks.moduleRole = 'feature';
      const decorAndVal = new DecoratorMeta(featureModule, initHooks);
      expect(isFeatureModule(decorAndVal)).toBe(true);
    });

    it('NormalizedModuleMeta true', () => {
      @featureModule()
      class Module1 {
        method1() {}
      }

      const normalizedModuleMeta = new NormalizedModuleMeta();
      const metadata = Reflector.getClassLevelMeta(Module1)![0];
      normalizedModuleMeta.moduleOptions = metadata.value;
      expect(isFeatureModule(normalizedModuleMeta)).toBe(true);
    });

    it('NormalizedModuleMeta false', () => {
      const normalizedModuleMeta = new NormalizedModuleMeta();
      normalizedModuleMeta.moduleOptions = {};
      expect(isFeatureModule(normalizedModuleMeta)).toBe(false);
    });

    it('initHooks in NormalizedModuleMeta false', () => {
      const initHooks = new InitHooks({});
      const normalizedModuleMeta = new NormalizedModuleMeta();
      normalizedModuleMeta.moduleOptions = initHooks;
      expect(isFeatureModule(normalizedModuleMeta)).toBe(false);
    });

    it('initHooks in NormalizedModuleMeta true', () => {
      const initHooks = new InitHooks({});
      initHooks.moduleRole = 'feature';
      const normalizedModuleMeta = new NormalizedModuleMeta();
      normalizedModuleMeta.moduleOptions = initHooks;
      expect(isFeatureModule(normalizedModuleMeta)).toBe(true);
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

    it('FeatureModuleOptions', () => {
      expect(isFeatureModule(new FeatureModuleOptions())).toBe(true);
    });
  });

  describe('isRootModule()', () => {
    it('class with decorator', () => {
      @rootModule({})
      class Module1 {}
      const moduleOptions = Reflector.getClassLevelMeta(Module1, isRootModule);
      expect(moduleOptions).toBeDefined();
    });

    it('class without decorator', () => {
      class Module1 {}
      const metadata = Reflector.collectMeta(Module1);
      expect(isRootModule(metadata)).toBe(false);
    });
  });

  describe('isDynamicModule', () => {
    it('module without params', () => {
      @featureModule({})
      class Module1 {}

      expect(isDynamicModule(Module1)).toBe(false);
    });

    it('module with params', () => {
      @featureModule({})
      class Module1 {
        static withOpts(): DynamicModule<Module1> {
          return {
            module: Module1,
            providersPerMod: [],
          };
        }
      }

      const modObj = Module1.withOpts();
      expect(isDynamicModule(modObj)).toBe(true);
    });
  });
});
