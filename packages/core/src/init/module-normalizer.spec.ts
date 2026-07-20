import { featureModule } from '#decorators/feature-module.js';
import { InitDecoratorOptions, InitHooks, InitDecorator } from '#decorators/init-hooks-and-metadata.js';
import { NormalizedInitMeta, getProxyForInitMeta, NormalizedModuleMeta } from '#init/normalized-meta.js';
import { rootModule, RootDecoratorOptions } from '#decorators/root-module.js';
import { Reflector } from '#di/reflector.js';
import { Extension } from '#extension/extension-types.js';
import { AnyObj, ModRefId } from '#types/mix.js';
import {
  DynamicModuleOptions,
  ModuleDecoratorOptions,
  DynamicModuleWithInit,
  DynamicModule,
} from '#decorators/module-decorator-options.js';
import { clearDebugClassNames } from '#utils/get-debug-class-name.js';
import { ModuleNormalizer } from './module-normalizer.js';
import { ProviderBuilder } from '#utils/providers.js';
import {
  UnknownExport,
  ForbiddenNormalizedExport,
  ForbiddenAppExport,
  InvalidExtension,
  InvalidModRefId,
  MissingModuleDecorator,
  EmptyModuleMeta,
  ReexportFailure,
  ResolvedCollisionTokensOnly,
  UndefinedSymbol,
} from '#error/core-errors.js';
import { injectable } from '#di/decorators.js';
import type { MultiProvider } from '#di/utils.js';
import { forwardRef } from '#di/forward-ref.js';
import { KeyRegistry } from '#di/key-registry.js';
import { isDynamicModule } from '#decorators/type-guards.js';
import { DecoratorMeta } from '#di/top/decorator-and-value.js';

describe('ModuleNormalizer', () => {
  class MockModuleNormalizer extends ModuleNormalizer {
    override normalize(modRefId: ModRefId, allInitHooks = new Map()): NormalizedModuleMeta {
      return super.normalize(modRefId, allInitHooks);
    }
  }

  let normalizer: MockModuleNormalizer;

  beforeEach(() => {
    clearDebugClassNames();
    normalizer = new MockModuleNormalizer();
  });

  describe('base module metadata', () => {
    it('normalizes an empty root module without requiring providers, exports, extensions, or init hooks', () => {
      @rootModule()
      class AppModule {}

      const normalizedModuleMeta = normalizer.normalize(AppModule);
      expect(normalizedModuleMeta).toMatchObject({
        id: '',
        name: 'AppModule',
        decoratorOptions: new RootDecoratorOptions(),
        modRefId: AppModule,
        declaredInDir: expect.any(String),
        isExternal: undefined,
        importsModules: [],
        importsWithOpts: [],
        providersPerApp: [],
        providersPerMod: [],
        providersPerRou: [],
        providersPerReq: [],
        exportsModules: [],
        exportsWithOpts: [],
      });
      expect(normalizedModuleMeta.mInitHooks).toBeInstanceOf(Map);
    });

    it('normalizes imports, exports, providers, resolved collisions, and extension metadata from rootModule options', () => {
      class AppService {}
      class ModService {}
      class RouService {}
      class ReqService {}
      class MultiService {}

      @injectable()
      class Extension1 implements Extension {
        async stage1() {
          return;
        }
      }

      @featureModule()
      class ImportedModule {}

      @featureModule()
      class ImportedDynamicModule {}

      const dynamicModule: DynamicModule = { module: ImportedDynamicModule, id: 'dynamic-id' };
      const multiProvider: MultiProvider = { token: MultiService, useValue: 'multi-value', multi: true };

      @rootModule({
        imports: [ImportedModule, dynamicModule],
        providersPerApp: new ProviderBuilder().passThrough(AppService),
        providersPerMod: [ModService, multiProvider],
        providersPerRou: [RouService],
        providersPerReq: [ReqService],
        resolvedCollisionsPerApp: [[AppService, ImportedModule]],
        resolvedCollisionsPerMod: [[ModService, ImportedDynamicModule]],
        resolvedCollisionsPerRou: [[RouService, ImportedModule]],
        resolvedCollisionsPerReq: [[ReqService, ImportedDynamicModule]],
        extensions: [{ extension: Extension1, export: true }],
        extensionsMeta: { feature: 'enabled' },
        exports: [ModService, RouService, ReqService, MultiService, ImportedModule],
      })
      class AppModule {}

      const normalizedModuleMeta = normalizer.normalize(AppModule);
      expect(normalizedModuleMeta.declaredInDir).toEqual(expect.any(String));
      expect(normalizedModuleMeta.importsModules).toEqual([ImportedModule]);
      expect(normalizedModuleMeta.importsWithOpts).toEqual([dynamicModule]);
      expect(normalizedModuleMeta.exportsModules).toEqual([ImportedModule]);
      expect(normalizedModuleMeta.providersPerApp).toEqual([AppService]);
      expect(normalizedModuleMeta.providersPerMod).toEqual([ModService, multiProvider]);
      expect(normalizedModuleMeta.providersPerRou).toEqual([RouService]);
      expect(normalizedModuleMeta.providersPerReq).toEqual([ReqService]);
      expect(normalizedModuleMeta.exportedProvidersPerMod).toEqual([ModService]);
      expect(normalizedModuleMeta.exportedProvidersPerRou).toEqual([RouService]);
      expect(normalizedModuleMeta.exportedProvidersPerReq).toEqual([ReqService]);
      expect(normalizedModuleMeta.exportedMultiProvidersPerMod).toEqual([multiProvider]);
      expect(normalizedModuleMeta.exportedMultiProvidersPerRou).toEqual([]);
      expect(normalizedModuleMeta.exportedMultiProvidersPerReq).toEqual([]);
      expect(normalizedModuleMeta.resolvedCollisionsPerApp).toEqual([[AppService, ImportedModule]]);
      expect(normalizedModuleMeta.resolvedCollisionsPerMod).toEqual([[ModService, ImportedDynamicModule]]);
      expect(normalizedModuleMeta.resolvedCollisionsPerRou).toEqual([[RouService, ImportedModule]]);
      expect(normalizedModuleMeta.resolvedCollisionsPerReq).toEqual([[ReqService, ImportedDynamicModule]]);
      expect(normalizedModuleMeta.extensionProviders).toEqual([Extension1]);
      expect(normalizedModuleMeta.exportedExtensionProviders).toEqual([Extension1]);
      expect(normalizedModuleMeta.extensionsMeta).toEqual({ feature: 'enabled' });
    });
  });

  describe('provider exports', () => {
    it('exports declared provider tokens separately for Mod, Rou, and Req levels', () => {
      class ModService {}
      class RouService {}
      class ReqService {}

      @featureModule({
        providersPerMod: [ModService],
        providersPerRou: [RouService],
        providersPerReq: [ReqService],
        exports: [ModService, RouService, ReqService],
      })
      class Module1 {}

      const normalizedModuleMeta = normalizer.normalize(Module1);
      expect(normalizedModuleMeta.exportedProvidersPerMod).toEqual([ModService]);
      expect(normalizedModuleMeta.exportedProvidersPerRou).toEqual([RouService]);
      expect(normalizedModuleMeta.exportedProvidersPerReq).toEqual([ReqService]);
    });

    it('exports multi providers separately for Mod, Rou, and Req levels', () => {
      class ModMultiService {}
      class RouMultiService {}
      class ReqMultiService {}

      const modMultiProvider: MultiProvider = { token: ModMultiService, useValue: 'mod', multi: true };
      const rouMultiProvider: MultiProvider = { token: RouMultiService, useValue: 'rou', multi: true };
      const reqMultiProvider: MultiProvider = { token: ReqMultiService, useValue: 'req', multi: true };

      @featureModule({
        providersPerMod: [modMultiProvider],
        providersPerRou: [rouMultiProvider],
        providersPerReq: [reqMultiProvider],
        exports: [ModMultiService, RouMultiService, ReqMultiService],
      })
      class Module1 {}

      const normalizedModuleMeta = normalizer.normalize(Module1);
      expect(normalizedModuleMeta.exportedMultiProvidersPerMod).toEqual([modMultiProvider]);
      expect(normalizedModuleMeta.exportedMultiProvidersPerRou).toEqual([rouMultiProvider]);
      expect(normalizedModuleMeta.exportedMultiProvidersPerReq).toEqual([reqMultiProvider]);
      expect(normalizedModuleMeta.exportedProvidersPerMod).toEqual([]);
      expect(normalizedModuleMeta.exportedProvidersPerRou).toEqual([]);
      expect(normalizedModuleMeta.exportedProvidersPerReq).toEqual([]);
    });

    it('throws ForbiddenAppExport when a module exports a providersPerApp token', () => {
      class AppService {}

      @featureModule({ providersPerApp: [AppService], exports: [AppService] })
      class Module1 {}

      expect(() => normalizer.normalize(Module1)).toThrow(new ForbiddenAppExport('Module1', 'AppService'));
    });

    it('throws ForbiddenNormalizedExport when exports contains a normalized provider object', () => {
      class Service1 {}

      @featureModule({ providersPerMod: [Service1], exports: [{ token: Service1, useClass: Service1 }] })
      class Module1 {}

      expect(() => normalizer.normalize(Module1)).toThrow(new ForbiddenNormalizedExport('Module1', 'Service1'));
    });

    it('throws UnknownExport when exports contains an undeclared provider token', () => {
      class Service1 {}
      class Service2 {}

      @featureModule({ providersPerMod: [Service1], exports: [Service2] })
      class Module1 {}

      expect(() => normalizer.normalize(Module1)).toThrow(new UnknownExport('Module1', 'Service2'));
    });
  });

  describe('module imports and re-exports', () => {
    it('re-exports an imported module class when the exported module has module metadata', () => {
      class Service1 {}

      @featureModule({ providersPerMod: [Service1], exports: [Service1] })
      class ImportedModule {}

      @featureModule({
        imports: [ImportedModule],
        providersPerMod: [{ token: 'local-token', useValue: 1 }],
        exports: ['local-token', ImportedModule],
      })
      class Module1 {}

      const normalizedModuleMeta = normalizer.normalize(Module1);
      expect(normalizedModuleMeta.importsModules).toEqual([ImportedModule]);
      expect(normalizedModuleMeta.exportsModules).toEqual([ImportedModule]);
    });

    it('throws UnknownExport when re-export target has no module decorator metadata', () => {
      class UndecoratedModule {}

      @featureModule({
        imports: [UndecoratedModule],
        providersPerMod: [{ token: 'local-token', useValue: 1 }],
        exports: ['local-token', UndecoratedModule],
      })
      class Module1 {}

      expect(() => normalizer.normalize(Module1)).toThrow(new UnknownExport('Module1', 'UndecoratedModule'));
    });

    it('throws ReexportFailure when a decorated module class is exported without being imported', () => {
      class Service1 {}

      @featureModule({ providersPerMod: [Service1], exports: [Service1] })
      class ImportedModule {}

      @featureModule({
        providersPerMod: [{ token: 'local-token', useValue: 1 }],
        exports: ['local-token', ImportedModule],
      })
      class Module1 {}

      expect(() => normalizer.normalize(Module1)).toThrow(new ReexportFailure('Module1', 'ImportedModule'));
    });

    it('throws ReexportFailure when importing a DynamicModule but exporting only its module class', () => {
      class Service1 {}

      @featureModule({ providersPerMod: [Service1], exports: [Service1] })
      class ImportedModule {}

      const dynamicModule: DynamicModule = { module: ImportedModule, providersPerMod: [] };

      @featureModule({
        imports: [dynamicModule],
        providersPerMod: [{ token: 'local-token', useValue: 1 }],
        exports: ['local-token', ImportedModule],
      })
      class Module1 {}

      expect(() => normalizer.normalize(Module1)).toThrow(new ReexportFailure('Module1', 'ImportedModule'));
    });

    it('re-exports the same DynamicModule object that was imported through module params', () => {
      class Service1 {}
      class Service2 {}

      @featureModule({ providersPerMod: [Service1] })
      class ImportedModule {}

      const dynamicModule: DynamicModule = { module: ImportedModule, exports: [Service1] };

      @featureModule({ imports: [dynamicModule], providersPerMod: [Service2], exports: [Service2] })
      class Module1 {}

      const normalizedModuleMeta = normalizer.normalize({ module: Module1, exports: [dynamicModule] });
      expect(normalizedModuleMeta.importsWithOpts).toEqual([dynamicModule]);
      expect(normalizedModuleMeta.exportsWithOpts).toEqual([dynamicModule]);
      expect(normalizedModuleMeta.providersPerMod).toEqual([Service2]);
    });
  });

  describe('dynamic modules', () => {
    it('merges dynamic module id, providers, exports, and extensionsMeta into static module metadata', () => {
      class StaticAppService {}
      class DynamicAppService {}
      class StaticModService {}
      class DynamicModService {}
      class StaticRouService {}
      class DynamicRouService {}
      class StaticReqService {}
      class DynamicReqService {}

      @featureModule({
        providersPerApp: new ProviderBuilder().passThrough(StaticAppService),
        providersPerMod: [StaticModService],
        providersPerRou: [StaticRouService],
        providersPerReq: [StaticReqService],
        exports: [StaticModService, StaticRouService, StaticReqService],
        extensionsMeta: { staticOnly: true, shared: 'static' },
      })
      class Module1 {}

      const normalizedModuleMeta = normalizer.normalize({
        id: 'dynamic-id',
        module: Module1,
        providersPerApp: [DynamicAppService],
        providersPerMod: [DynamicModService],
        providersPerRou: [DynamicRouService],
        providersPerReq: [DynamicReqService],
        extensionsMeta: { dynamicOnly: true, shared: 'dynamic' },
        exports: [DynamicModService, DynamicRouService, DynamicReqService],
      });

      expect(normalizedModuleMeta.id).toBe('dynamic-id');
      expect(normalizedModuleMeta.providersPerApp).toEqual([StaticAppService, DynamicAppService]);
      expect(normalizedModuleMeta.providersPerMod).toEqual([StaticModService, DynamicModService]);
      expect(normalizedModuleMeta.providersPerRou).toEqual([StaticRouService, DynamicRouService]);
      expect(normalizedModuleMeta.providersPerReq).toEqual([StaticReqService, DynamicReqService]);
      expect(normalizedModuleMeta.exportedProvidersPerMod).toEqual([StaticModService, DynamicModService]);
      expect(normalizedModuleMeta.exportedProvidersPerRou).toEqual([StaticRouService, DynamicRouService]);
      expect(normalizedModuleMeta.exportedProvidersPerReq).toEqual([StaticReqService, DynamicReqService]);
      expect(normalizedModuleMeta.extensionsMeta).toEqual({
        staticOnly: true,
        dynamicOnly: true,
        shared: 'dynamic',
      });
    });

    it('resolves forwardRef in the dynamic module class, dynamic providers, and dynamic exports', () => {
      class StaticService {}
      class DynamicService {}
      class DynamicClassProviderService {}

      @featureModule({
        providersPerMod: [StaticService],
        exports: [StaticService],
      })
      class Module1 {}

      const dynamicModule: DynamicModule = {
        module: forwardRef(() => Module1),
        providersPerMod: [
          forwardRef(() => DynamicService),
          {
            token: forwardRef(() => DynamicClassProviderService),
            useClass: forwardRef(() => DynamicClassProviderService),
          },
        ],
        exports: [forwardRef(() => DynamicService), forwardRef(() => DynamicClassProviderService)],
      };

      const normalizedModuleMeta = normalizer.normalize(dynamicModule);
      expect(normalizedModuleMeta.name).toBe('Module1-DynamicModule');
      expect(normalizedModuleMeta.providersPerMod).toEqual([
        StaticService,
        DynamicService,
        { token: DynamicClassProviderService, useClass: DynamicClassProviderService },
      ]);
      expect(normalizedModuleMeta.exportedProvidersPerMod).toEqual([
        StaticService,
        DynamicService,
        { token: DynamicClassProviderService, useClass: DynamicClassProviderService },
      ]);
    });
  });

  describe('forwardRef resolution', () => {
    it('resolves forwardRef in imports, exports, providers, multi providers, and resolved collisions', () => {
      class AppService {}
      class ModService {}
      class AppMultiService {}
      class ModMultiService {}

      @featureModule({ providersPerApp: [AppService] })
      class ImportedModule {}

      @featureModule({ providersPerApp: [AppService] })
      class DynamicImportedModule {}

      const dynamicModule: DynamicModule = { module: forwardRef(() => DynamicImportedModule) };

      @rootModule({
        imports: [forwardRef(() => ImportedModule), dynamicModule],
        providersPerApp: [
          forwardRef(() => AppService),
          { token: forwardRef(() => AppMultiService), useClass: forwardRef(() => AppMultiService), multi: true },
        ],
        providersPerMod: [
          forwardRef(() => ModService),
          { token: forwardRef(() => ModMultiService), useToken: forwardRef(() => ModMultiService), multi: true },
        ],
        resolvedCollisionsPerMod: [[forwardRef(() => ModService), forwardRef(() => ImportedModule)]],
        exports: [
          forwardRef(() => ModService),
          forwardRef(() => ModMultiService),
          forwardRef(() => ImportedModule),
          dynamicModule,
        ],
      })
      class AppModule {}

      const normalizedModuleMeta = normalizer.normalize(AppModule);
      expect(normalizedModuleMeta.importsModules).toEqual([ImportedModule]);
      expect(normalizedModuleMeta.importsWithOpts).toEqual([{ module: DynamicImportedModule }]);
      expect(normalizedModuleMeta.exportsModules).toEqual([ImportedModule]);
      expect(normalizedModuleMeta.exportsWithOpts).toEqual([{ module: DynamicImportedModule }]);
      expect(normalizedModuleMeta.providersPerApp).toEqual([
        AppService,
        { token: AppMultiService, useClass: AppMultiService, multi: true },
      ]);
      expect(normalizedModuleMeta.providersPerMod).toEqual([
        ModService,
        { token: ModMultiService, useToken: ModMultiService, multi: true },
      ]);
      expect(normalizedModuleMeta.exportedProvidersPerMod).toEqual([ModService]);
      expect(normalizedModuleMeta.exportedMultiProvidersPerMod).toEqual([
        { token: ModMultiService, useToken: ModMultiService, multi: true },
      ]);
      expect(normalizedModuleMeta.resolvedCollisionsPerMod).toEqual([[ModService, ImportedModule]]);
    });
  });

  describe('extensions', () => {
    it('normalizes and exports an extension class that implements a stage method', () => {
      @injectable()
      class Extension1 implements Extension {
        async stage1() {}
      }

      @featureModule({ extensions: [{ extension: Extension1, export: true }] })
      class Module1 {}

      const normalizedModuleMeta = normalizer.normalize(Module1);
      expect(normalizedModuleMeta.extensionProviders).toEqual([Extension1]);
      expect(normalizedModuleMeta.exportedExtensionProviders).toEqual([Extension1]);
    });

    it('accepts extensions that implement only stage2 or only stage3', () => {
      @injectable()
      class Stage2Extension implements Extension {
        async stage2() {}
      }

      @injectable()
      class Stage3Extension implements Extension {
        async stage3() {}
      }

      @featureModule({ extensions: [Stage2Extension, Stage3Extension] })
      class Module1 {}

      const normalizedModuleMeta = normalizer.normalize(Module1);
      expect(normalizedModuleMeta.extensionProviders).toEqual([Stage2Extension, Stage3Extension]);
    });

    it('throws InvalidExtension when an extension provider has no stage method', () => {
      @injectable()
      class Extension1 {}

      @featureModule({ extensions: [{ extension: Extension1, export: true }] })
      class Module1 {}

      expect(() => normalizer.normalize(Module1)).toThrow(new InvalidExtension('Module1', 'Extension1'));
    });

    it('normalizes extension group providers and records the group token mapping', () => {
      @injectable()
      class Extension1 implements Extension {
        async stage1() {}
      }

      @injectable()
      class Extension2 implements Extension {
        async stage1() {}
      }

      @featureModule({ extensions: [{ extension: Extension1, groups: [Extension2] }] })
      class Module1 {}

      const normalizedModuleMeta = normalizer.normalize(Module1);
      const groupToken = KeyRegistry.getGroupToken(Extension2);
      expect(normalizedModuleMeta.extensionProviders).toEqual([
        { token: groupToken, useToken: Extension2, multi: true },
        Extension1,
        { token: groupToken, useToken: Extension1, multi: true },
      ]);
      expect(normalizedModuleMeta.mExtensionAsGroupToken.get(Extension2)).toBe(groupToken);
    });

    it('puts exportOnly extensions only into exported extension metadata', () => {
      @injectable()
      class Extension1 implements Extension {
        async stage1() {}
      }

      @featureModule({ extensions: [{ extension: Extension1, exportOnly: true }] })
      class Module1 {}

      const normalizedModuleMeta = normalizer.normalize(Module1);
      expect(normalizedModuleMeta.extensionProviders).toEqual([]);
      expect(normalizedModuleMeta.exportedExtensionProviders).toEqual([Extension1]);
      expect(normalizedModuleMeta.aExportedExtensionConfig).toHaveLength(1);
    });
  });

  describe('init decorators', () => {
    interface SomeInitDynamicOptions extends DynamicModuleOptions {
      path?: string;
      num?: number;
    }

    interface SomeInitOptions extends InitDecoratorOptions<SomeInitDynamicOptions> {
      one?: number;
      two?: number;
      flag?: boolean;
      appends?: ({ module: ModRefId } & AnyObj)[];
    }

    class SomeInitMeta extends NormalizedInitMeta {
      normalizedModuleMeta?: NormalizedModuleMeta;
      initDecoratorOptions?: SomeInitOptions;
      flag?: boolean;
      path?: string;
      targetModRefId?: ModRefId;
    }

    class SomeInitHooks extends InitHooks<SomeInitOptions> {
      override normalize(normalizedModuleMeta: NormalizedModuleMeta) {
        const meta = getProxyForInitMeta(normalizedModuleMeta, SomeInitMeta);
        meta.normalizedModuleMeta = normalizedModuleMeta;
        meta.initDecoratorOptions = this.decoratorOptions;

        if (isDynamicModule(normalizedModuleMeta.modRefId)) {
          const params = normalizedModuleMeta.modRefId.initOpts?.get(initSome);
          meta.path = params?.path;
          meta.targetModRefId = normalizedModuleMeta.modRefId;
        } else {
          meta.flag = this.decoratorOptions.flag;
          meta.targetModRefId = normalizedModuleMeta.modRefId;
        }

        return meta;
      }
    }

    function getInitHooks(data?: SomeInitOptions): InitHooks<SomeInitOptions> {
      return new SomeInitHooks(Object.assign({}, data));
    }

    const initSome: InitDecorator<SomeInitOptions, SomeInitDynamicOptions, SomeInitMeta> = Reflector.makeClassDecorator(
      getInitHooks,
      'initSome',
    );

    it('stores metadata returned by InitHooks.normalize() in normalizedModuleMeta.initMeta', () => {
      const decoratorOptions: SomeInitOptions = { one: 1, two: 2, flag: true };

      @initSome(decoratorOptions)
      @featureModule()
      class Module1 {}

      const initMeta = normalizer.normalize(Module1).initMeta.get(initSome);
      expect(initMeta?.normalizedModuleMeta?.modRefId).toBe(Module1);
      expect(initMeta?.initDecoratorOptions).toEqual(decoratorOptions);
      expect(initMeta?.targetModRefId).toBe(Module1);
      expect(initMeta?.flag).toBe(true);
    });

    it('normalizes providers, exports, extensions, and extensionsMeta declared by an init decorator', () => {
      class Service1 {}

      @injectable()
      class Extension1 implements Extension {
        async stage1() {}
      }

      @initSome({
        providersPerMod: [Service1],
        exports: [Service1],
        extensions: [{ extension: Extension1, export: true }],
        extensionsMeta: { one: 1 },
      })
      @featureModule()
      class Module1 {}

      const normalizedModuleMeta = normalizer.normalize(Module1);
      expect(normalizedModuleMeta.providersPerMod).toEqual([Service1]);
      expect(normalizedModuleMeta.exportedProvidersPerMod).toEqual([Service1]);
      expect(normalizedModuleMeta.extensionProviders).toEqual([Extension1]);
      expect(normalizedModuleMeta.exportedExtensionProviders).toEqual([Extension1]);
      expect(normalizedModuleMeta.extensionsMeta).toEqual({ one: 1 });
    });

    it('merges wrapper init params, dynamic module params, and existing initOpts when importing modules with params', () => {
      class Service1 {}
      class Service2 {}
      class Service3 {}

      @featureModule()
      class Module1 {}

      @featureModule()
      class Module2 {}

      const dynamicModule1: DynamicModuleWithInit & SomeInitDynamicOptions = {
        module: Module1,
        providersPerMod: [Service1],
        providersPerApp: [Service3],
        extensionsMeta: { one: 1 },
        num: 4,
        initOpts: new Map(),
      };
      dynamicModule1.initOpts.set(initSome, { path: 'path-1' });

      const dynamicModule2: DynamicModuleWithInit & SomeInitDynamicOptions = {
        module: Module2,
        providersPerApp: [Service2],
        num: 12,
        extensionsMeta: { four: 4 },
        initOpts: new Map(),
      };
      dynamicModule2.initOpts.set(initSome, {
        path: 'path-2',
        providersPerApp: [Service1],
        num: 11,
        extensionsMeta: { three: 3 },
      });

      @initSome({
        imports: [
          { dynamicModule: dynamicModule1, providersPerMod: [Service2], extensionsMeta: { two: 2 }, num: 5 },
          dynamicModule2,
        ],
      })
      @rootModule()
      class AppModule {}

      normalizer.normalize(AppModule);
      expect(dynamicModule1.initOpts.get(initSome)).toEqual<SomeInitDynamicOptions>({
        path: 'path-1',
        providersPerMod: [Service1, Service2],
        extensionsMeta: { one: 1, two: 2 },
        num: 5,
        providersPerApp: [Service3],
      });
      expect(dynamicModule2.initOpts.get(initSome)).toEqual<SomeInitDynamicOptions>({
        providersPerApp: [Service1, Service2],
        num: 12,
        extensionsMeta: { three: 3, four: 4 },
        path: 'path-2',
      });
    });

    it('normalizes init decorator imports and exports for module classes, DynamicModule objects, and wrappers', () => {
      class Service1 {}

      @featureModule({ providersPerApp: [Service1] })
      class Module1 {}

      @featureModule({ providersPerApp: [Service1] })
      class Module2 {}
      const dynamicModule2: DynamicModule = { module: Module2 };

      @featureModule({ providersPerApp: [Service1] })
      class Module3 {}

      @featureModule({ providersPerApp: [Service1] })
      class Module4 {}
      const dynamicModule4: DynamicModule = { module: Module4 };

      @initSome({
        imports: [Module1, dynamicModule2, { module: Module3 }, { dynamicModule: dynamicModule4 }],
        exports: [Module1, dynamicModule2, dynamicModule4],
      })
      @rootModule()
      class AppModule {}

      const normalizedModuleMeta = normalizer.normalize(AppModule);
      expect(normalizedModuleMeta.importsModules).toEqual([Module1]);
      expect(normalizedModuleMeta.exportsModules).toEqual([Module1]);
      expect(normalizedModuleMeta.importsWithOpts).toEqual<DynamicModule[]>([
        dynamicModule2,
        { module: Module3, initOpts: expect.any(Map) },
        dynamicModule4,
      ]);
      expect(normalizedModuleMeta.exportsWithOpts).toEqual([dynamicModule2, dynamicModule4]);
    });

    it('resolves forwardRef in init decorator imports and exports', () => {
      class Service1 {}

      @featureModule({ providersPerApp: [Service1] })
      class Module1 {}

      @featureModule({ providersPerApp: [Service1] })
      class Module2 {}
      const dynamicModule2: DynamicModule = { module: forwardRef(() => Module2) };

      @featureModule({ providersPerApp: [Service1] })
      class Module3 {}

      @featureModule({ providersPerApp: [Service1] })
      class Module4 {}
      const dynamicModule4: DynamicModule = { module: forwardRef(() => Module4) };

      @initSome({
        imports: [
          forwardRef(() => Module1),
          dynamicModule2,
          { module: forwardRef(() => Module3) },
          { dynamicModule: dynamicModule4 },
        ],
        exports: [forwardRef(() => Module1), dynamicModule2, dynamicModule4],
      })
      @rootModule()
      class AppModule {}

      const normalizedModuleMeta = normalizer.normalize(AppModule);
      expect(normalizedModuleMeta.importsModules).toEqual([Module1]);
      expect(normalizedModuleMeta.importsWithOpts).toEqual<DynamicModule[]>([
        dynamicModule2,
        { module: Module3, initOpts: expect.any(Map) },
        dynamicModule4,
      ]);
      expect(normalizedModuleMeta.exportsModules).toEqual([Module1]);
      expect(normalizedModuleMeta.exportsWithOpts).toEqual([dynamicModule2, dynamicModule4]);
      expect(dynamicModule2.module).toBe(Module2);
      expect(dynamicModule4.module).toBe(Module4);
    });

    it('adds host decorator hooks from allInitHooks when the current module is the host module', () => {
      @featureModule()
      class HostModule {}

      class HostInitHooks extends InitHooks<SomeInitOptions> {
        override hostModule = HostModule;
        override hostDecoratorOptions = { flag: true };

        override normalize(normalizedModuleMeta: NormalizedModuleMeta): SomeInitMeta {
          return {
            flag: this.decoratorOptions.flag,
            targetModRefId: normalizedModuleMeta.modRefId,
          } as SomeInitMeta;
        }
      }

      const hostInitSome: InitDecorator<SomeInitOptions, {}, {}> = Reflector.makeClassDecorator(
        (data) => new HostInitHooks(data),
      );
      const allInitHooks = new Map([[hostInitSome, new HostInitHooks({})]]);

      const normalizedModuleMeta = normalizer.normalize(HostModule, allInitHooks);
      expect(normalizedModuleMeta.mInitHooks.has(hostInitSome)).toBe(true);
      expect(normalizedModuleMeta.initMeta.get(hostInitSome)).toEqual({ flag: true, targetModRefId: HostModule });
    });

    it('imports the host module when an init decorator declares hostModule on a different module', () => {
      @featureModule()
      class HostModule {}

      class HostInitHooks extends InitHooks<SomeInitOptions> {
        override hostModule = HostModule;
      }

      const hostInitSome: InitDecorator<SomeInitOptions, {}, {}> = Reflector.makeClassDecorator(
        (data) => new HostInitHooks(data),
      );

      class Service1 {}

      @hostInitSome({})
      @featureModule({ providersPerMod: [Service1], exports: [Service1] })
      class Module1 {}

      const normalizedModuleMeta = normalizer.normalize(Module1);
      expect(normalizedModuleMeta.importsModules).toContain(HostModule);
    });

    it('adds init hooks from allInitHooks for an imported dynamic module whose class does not have that init decorator', () => {
      class Service1 {}

      @featureModule({ providersPerApp: [Service1] })
      class Module1 {}

      const dynamicModule: DynamicModule = { module: Module1 };
      const allInitHooks = new Map([[initSome, new SomeInitHooks({})]]);

      @initSome({ imports: [{ dynamicModule, path: 'prefix' }] })
      @rootModule()
      class AppModule {}

      normalizer.normalize(AppModule);

      const normalizedModuleMeta = normalizer.normalize(dynamicModule, allInitHooks);
      expect(normalizedModuleMeta.initMeta.get(initSome)).toMatchObject({
        path: 'prefix',
        targetModRefId: dynamicModule,
      });
    });
  });

  describe('validation errors', () => {
    it('throws InvalidModRefId when the normalized value is neither a module class nor a DynamicModule', () => {
      expect(() => normalizer.normalize({} as ModRefId)).toThrow(new InvalidModRefId());
    });

    it('throws MissingModuleDecorator when the target class has no module decorator metadata', () => {
      class UndecoratedModule {}

      expect(() => normalizer.normalize(UndecoratedModule)).toThrow(new MissingModuleDecorator('UndecoratedModule'));
    });

    it('throws UndefinedSymbol with Imports context and array index when imports contains undefined', () => {
      @featureModule({
        imports: [undefined as any],
        providersPerMod: [{ token: 'local-token', useValue: 1 }],
        exports: ['local-token'],
      })
      class Module1 {}

      expect(() => normalizer.normalize(Module1)).toThrow(new UndefinedSymbol('Imports', 'Module1', 0));
    });

    it('throws UndefinedSymbol with Exports context and array index when static exports contains undefined', () => {
      class Service1 {}

      @featureModule({ providersPerMod: [Service1], exports: [undefined as any] })
      class Module1 {}

      expect(() => normalizer.normalize(Module1)).toThrow(new UndefinedSymbol('Exports', 'Module1', 0));
    });

    it('throws UndefinedSymbol with Exports with params context when dynamic module exports contains undefined', () => {
      class Service1 {}

      @featureModule({ providersPerMod: [Service1], exports: [Service1] })
      class Module1 {}

      expect(() => normalizer.normalize({ module: Module1, exports: [undefined as any] })).toThrow(
        new UndefinedSymbol('Exports with params', 'Module1-DynamicModule', 0),
      );
    });

    it('throws ResolvedCollisionTokensOnly when resolvedCollisionsPerMod uses a normalized provider instead of a token', () => {
      class Service1 {}

      @featureModule()
      class ImportedModule {}

      @featureModule({
        providersPerMod: [Service1],
        resolvedCollisionsPerMod: [[{ token: Service1, useClass: Service1 }, ImportedModule]],
        exports: [Service1],
      })
      class Module1 {}

      expect(() => normalizer.normalize(Module1)).toThrow(new ResolvedCollisionTokensOnly('Module1', 'Service1'));
    });

    it('throws EmptyModuleMeta for a feature module that contributes no metadata', () => {
      @featureModule()
      class EmptyModule {}

      const normalizedModuleMeta = normalizer.normalize(EmptyModule);
      expect(() => normalizer.checkEmptyMeta(normalizedModuleMeta)).toThrow(new EmptyModuleMeta());
    });
  });

  describe('external module detection', () => {
    class ExternalModuleNormalizer extends ModuleNormalizer {
      customMeta = new Map<any, DecoratorMeta[]>();

      override normalize(modRefId: any, allInitHooks = new Map()): NormalizedModuleMeta {
        return super.normalize(modRefId, allInitHooks);
      }

      protected override getDecoratorMeta(modRefId: any) {
        return this.customMeta.get(modRefId);
      }
    }

    it('marks modules outside rootDeclaredInDir as external and modules inside rootDeclaredInDir as internal', () => {
      const externalModuleNormalizer = new ExternalModuleNormalizer();
      class AppModule {}
      class ExternalModule {}
      class InternalModule {}

      const dummyDecorator = () => {};
      const rootDec = new DecoratorMeta(dummyDecorator, new RootDecoratorOptions(), undefined, '/user-project/src');
      externalModuleNormalizer.customMeta.set(AppModule, [rootDec]);

      const externalModuleOptions = Object.assign(new ModuleDecoratorOptions(), {
        providersPerApp: [{ token: 'external-token', useValue: 1 }],
      });
      const externalDec = new DecoratorMeta(
        dummyDecorator,
        externalModuleOptions,
        undefined,
        '/node_modules/external-mod',
      );
      externalModuleNormalizer.customMeta.set(ExternalModule, [externalDec]);

      const internalModuleOptions = Object.assign(new ModuleDecoratorOptions(), {
        providersPerApp: [{ token: 'internal-token', useValue: 1 }],
      });
      const internalDec = new DecoratorMeta(
        dummyDecorator,
        internalModuleOptions,
        undefined,
        '/user-project/src/features/internal-mod',
      );
      externalModuleNormalizer.customMeta.set(InternalModule, [internalDec]);

      expect(externalModuleNormalizer.normalize(AppModule).isExternal).toBeUndefined();
      expect(externalModuleNormalizer.normalize(ExternalModule).isExternal).toBe(true);
      expect(externalModuleNormalizer.normalize(InternalModule).isExternal).toBe(false);
    });

    it('marks Ditsmod package modules as external when the root module is not declared inside ditsmod/packages', () => {
      const externalModuleNormalizer = new ExternalModuleNormalizer();
      class AppModule {}
      class DitsmodModule {}

      const dummyDecorator = () => {};
      const rootDec = new DecoratorMeta(dummyDecorator, new RootDecoratorOptions(), undefined, '/user-project/src');
      externalModuleNormalizer.customMeta.set(AppModule, [rootDec]);

      const ditsmodModuleOptions = Object.assign(new ModuleDecoratorOptions(), {
        providersPerApp: [{ token: 'ditsmod-token', useValue: 1 }],
      });
      const ditsmodDec = new DecoratorMeta(
        dummyDecorator,
        ditsmodModuleOptions,
        undefined,
        '/user-project/node_modules/ditsmod/packages/core',
      );
      externalModuleNormalizer.customMeta.set(DitsmodModule, [ditsmodDec]);

      externalModuleNormalizer.normalize(AppModule);
      expect(externalModuleNormalizer.normalize(DitsmodModule).isExternal).toBe(true);
    });
  });
});
