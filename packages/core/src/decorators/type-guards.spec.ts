import { Reflector } from '#di/reflector.js';
import { DecoratorMeta } from '#di/top/decorator-and-value.js';
import { featureModule } from '#decorators/feature-module.js';
import { rootModule, RootModuleOptions } from '#decorators/root-module.js';
import { FeatureModuleOptions, DynamicModule } from '#decorators/module-decorator-options.js';
import { InitHooks } from '#decorators/init-hooks-and-metadata.js';
import { NormalizedModuleMeta } from '#init/normalized-meta.js';
import {
  isFeatureModule,
  isDynamicModule,
  isRootModule,
  isDynamicModuleWrapper,
  isModuleDecorator,
  isModuleWithInitHooks,
  hasDeclaredInDir,
} from '#decorators/type-guards.js';

describe('type guards', () => {
  describe('isDynamicModuleWrapper()', () => {
    it('returns true when dynamicModule property is a DynamicModule', () => {
      class Module1 {}
      const wrapper = { dynamicModule: { module: Module1 } };
      expect(isDynamicModuleWrapper(wrapper)).toBe(true);
    });

    it('returns false when dynamicModule property is invalid or an empty object', () => {
      const wrapper = { dynamicModule: {} as DynamicModule };
      expect(isDynamicModuleWrapper(wrapper)).toBe(false);
    });

    it('returns false for empty object or undefined', () => {
      expect(isDynamicModuleWrapper({})).toBe(false);
      expect(isDynamicModuleWrapper()).toBe(false);
    });
  });

  describe('isFeatureModule()', () => {
    it('returns false for class metadata without module decorator', () => {
      class Module1 {}
      const metadata = Reflector.collectMeta(Module1);
      expect(isFeatureModule(metadata)).toBe(false);
    });

    it('returns true for DecoratorMeta with featureModule', () => {
      @featureModule()
      class Module1 {}
      const metadata = Reflector.getClassLevelMeta(Module1)![0];
      expect(isFeatureModule(metadata)).toBe(true);
    });

    it('returns false for DecoratorMeta with InitHooks when moduleRole is not feature', () => {
      const initHooks = new InitHooks({});
      const decorAndVal = new DecoratorMeta(featureModule, initHooks);
      expect(isFeatureModule(decorAndVal)).toBe(false);
    });

    it('returns true for DecoratorMeta with InitHooks when moduleRole is feature', () => {
      const initHooks = new InitHooks({});
      initHooks.moduleRole = 'feature';
      const decorAndVal = new DecoratorMeta(featureModule, initHooks);
      expect(isFeatureModule(decorAndVal)).toBe(true);
    });

    it('returns true for NormalizedModuleMeta with FeatureModuleOptions', () => {
      @featureModule()
      class Module1 {
        method1() {}
      }

      const normalizedModuleMeta = new NormalizedModuleMeta();
      const metadata = Reflector.getClassLevelMeta(Module1)![0];
      normalizedModuleMeta.moduleOptions = metadata.value;
      expect(isFeatureModule(normalizedModuleMeta)).toBe(true);
    });

    it('returns false for NormalizedModuleMeta with empty moduleOptions', () => {
      const normalizedModuleMeta = new NormalizedModuleMeta();
      normalizedModuleMeta.moduleOptions = {};
      expect(isFeatureModule(normalizedModuleMeta)).toBe(false);
    });

    it('returns false for NormalizedModuleMeta with InitHooks when moduleRole is not feature', () => {
      const initHooks = new InitHooks({});
      const normalizedModuleMeta = new NormalizedModuleMeta();
      normalizedModuleMeta.moduleOptions = initHooks;
      expect(isFeatureModule(normalizedModuleMeta)).toBe(false);
    });

    it('returns true for NormalizedModuleMeta with InitHooks when moduleRole is feature', () => {
      const initHooks = new InitHooks({});
      initHooks.moduleRole = 'feature';
      const normalizedModuleMeta = new NormalizedModuleMeta();
      normalizedModuleMeta.moduleOptions = initHooks;
      expect(isFeatureModule(normalizedModuleMeta)).toBe(true);
    });

    it('returns true for direct InitHooks instance when moduleRole is feature', () => {
      const initHooks = new InitHooks({});
      initHooks.moduleRole = 'feature';
      expect(isFeatureModule(initHooks)).toBe(true);
    });

    it('returns false for direct InitHooks instance when moduleRole is not feature', () => {
      const initHooks = new InitHooks({});
      expect(isFeatureModule(initHooks)).toBe(false);
    });

    it('returns true for FeatureModuleOptions instance', () => {
      expect(isFeatureModule(new FeatureModuleOptions())).toBe(true);
    });
  });

  describe('isRootModule()', () => {
    it('returns module options when collecting class level metadata', () => {
      @rootModule({})
      class Module1 {}
      const moduleOptions = Reflector.getClassLevelMeta(Module1, isRootModule);
      expect(moduleOptions).toBeDefined();
    });

    it('returns false for class metadata without module decorator', () => {
      class Module1 {}
      const metadata = Reflector.collectMeta(Module1);
      expect(isRootModule(metadata)).toBe(false);
    });

    it('returns true for DecoratorMeta with rootModule', () => {
      @rootModule({})
      class Module1 {}
      const metadata = Reflector.getClassLevelMeta(Module1)![0];
      expect(isRootModule(metadata)).toBe(true);
    });

    it('returns false for DecoratorMeta with InitHooks when moduleRole is not root', () => {
      const initHooks = new InitHooks({});
      const decorAndVal = new DecoratorMeta(rootModule, initHooks);
      expect(isRootModule(decorAndVal)).toBe(false);
    });

    it('returns true for DecoratorMeta with InitHooks when moduleRole is root', () => {
      const initHooks = new InitHooks({});
      initHooks.moduleRole = 'root';
      const decorAndVal = new DecoratorMeta(rootModule, initHooks);
      expect(isRootModule(decorAndVal)).toBe(true);
    });

    it('returns true for NormalizedModuleMeta with RootModuleOptions', () => {
      @rootModule({})
      class Module1 {}

      const normalizedModuleMeta = new NormalizedModuleMeta();
      const metadata = Reflector.getClassLevelMeta(Module1)![0];
      normalizedModuleMeta.moduleOptions = metadata.value;
      expect(isRootModule(normalizedModuleMeta)).toBe(true);
    });

    it('returns false for NormalizedModuleMeta with empty moduleOptions', () => {
      const normalizedModuleMeta = new NormalizedModuleMeta();
      normalizedModuleMeta.moduleOptions = {};
      expect(isRootModule(normalizedModuleMeta)).toBe(false);
    });

    it('returns false for NormalizedModuleMeta with InitHooks when moduleRole is not root', () => {
      const initHooks = new InitHooks({});
      const normalizedModuleMeta = new NormalizedModuleMeta();
      normalizedModuleMeta.moduleOptions = initHooks;
      expect(isRootModule(normalizedModuleMeta)).toBe(false);
    });

    it('returns true for NormalizedModuleMeta with InitHooks when moduleRole is root', () => {
      const initHooks = new InitHooks({});
      initHooks.moduleRole = 'root';
      const normalizedModuleMeta = new NormalizedModuleMeta();
      normalizedModuleMeta.moduleOptions = initHooks;
      expect(isRootModule(normalizedModuleMeta)).toBe(true);
    });

    it('returns true for direct InitHooks instance when moduleRole is root', () => {
      const initHooks = new InitHooks({});
      initHooks.moduleRole = 'root';
      expect(isRootModule(initHooks)).toBe(true);
    });

    it('returns false for direct InitHooks instance when moduleRole is not root', () => {
      const initHooks = new InitHooks({});
      expect(isRootModule(initHooks)).toBe(false);
    });

    it('returns true for RootModuleOptions instance', () => {
      expect(isRootModule(new RootModuleOptions())).toBe(true);
    });
  });

  describe('isModuleDecorator()', () => {
    it('returns true for rootModule DecoratorMeta', () => {
      @rootModule({})
      class Module1 {}
      const metadata = Reflector.getClassLevelMeta(Module1)![0];
      expect(isModuleDecorator(metadata)).toBe(true);
    });

    it('returns true for featureModule DecoratorMeta', () => {
      @featureModule({})
      class Module2 {}
      const metadata = Reflector.getClassLevelMeta(Module2)![0];
      expect(isModuleDecorator(metadata)).toBe(true);
    });

    it('returns true for RootModuleOptions instance', () => {
      expect(isModuleDecorator(new RootModuleOptions())).toBe(true);
    });

    it('returns true for FeatureModuleOptions instance', () => {
      expect(isModuleDecorator(new FeatureModuleOptions())).toBe(true);
    });

    it('returns false for non-module metadata or random object', () => {
      const otherDecorMeta = new DecoratorMeta(function () {}, {});
      expect(isModuleDecorator(otherDecorMeta)).toBe(false);
      expect(isModuleDecorator({} as any)).toBe(false);
    });
  });

  describe('isModuleWithInitHooks()', () => {
    it('returns true for DecoratorMeta wrapping InitHooks', () => {
      const initHooks = new InitHooks({});
      const decorAndVal = new DecoratorMeta(featureModule, initHooks);
      expect(isModuleWithInitHooks(decorAndVal)).toBe(true);
    });

    it('returns false for DecoratorMeta not wrapping InitHooks', () => {
      const decorAndVal = new DecoratorMeta(featureModule, new FeatureModuleOptions());
      expect(isModuleWithInitHooks(decorAndVal)).toBe(false);
    });

    it('returns true for direct InitHooks instance', () => {
      const initHooks = new InitHooks({});
      expect(isModuleWithInitHooks(initHooks)).toBe(true);
    });

    it('returns false for other object or undefined', () => {
      expect(isModuleWithInitHooks({} as any)).toBe(false);
      expect(isModuleWithInitHooks()).toBe(false);
    });
  });

  describe('hasDeclaredInDir()', () => {
    it('returns true when declaredInDir is set and not "."', () => {
      const metadata = new DecoratorMeta(featureModule, new FeatureModuleOptions());
      metadata.declaredInDir = '/some/path';
      expect(hasDeclaredInDir(metadata)).toBe(true);
    });

    it('returns false when declaredInDir is "."', () => {
      const metadata = new DecoratorMeta(featureModule, new FeatureModuleOptions());
      metadata.declaredInDir = '.';
      expect(hasDeclaredInDir(metadata)).toBe(false);
    });

    it('returns false when declaredInDir is undefined', () => {
      const metadata = new DecoratorMeta(featureModule, new FeatureModuleOptions());
      expect(hasDeclaredInDir(metadata)).toBe(false);
    });

    it('returns false when argument is undefined', () => {
      expect(hasDeclaredInDir()).toBe(false);
    });
  });

  describe('isDynamicModule()', () => {
    it('returns false for standard decorated module class', () => {
      @featureModule({})
      class Module1 {}

      expect(isDynamicModule(Module1)).toBe(false);
    });

    it('returns true for dynamic module object', () => {
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

    it('returns false for undefined', () => {
      expect(isDynamicModule()).toBe(false);
    });
  });
});
