import { featureModule } from '#decorators/feature-module.js';
import {
  InitDecoratorOptions as BaseInitDecoratorOptions,
  InitHooks,
  InitDecorator,
} from '#decorators/init-hooks-and-metadata.js';
import { NormalizedInitMeta, getProxyForInitMeta, NormalizedModuleMeta } from '#init/base-meta.js';
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
  EmptyModuleMetadata,
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
import { getModule } from '#utils/get-module.js';

describe('ModuleNormalizer', () => {
  class MockModuleNormalizer extends ModuleNormalizer {
    override normalize(modRefId: ModRefId, allInitHooks = new Map()): NormalizedModuleMeta {
      return super.normalize(modRefId, allInitHooks);
    }
  }

  let mock: MockModuleNormalizer;

  beforeEach(() => {
    clearDebugClassNames();
    mock = new MockModuleNormalizer();
  });

  it('empty root module', () => {
    @rootModule()
    class AppModule {}

    const expectedMeta = new NormalizedModuleMeta();
    expectedMeta.id = '';
    expectedMeta.name = 'AppModule';
    expectedMeta.decoratorOptions = new RootDecoratorOptions();
    expectedMeta.modRefId = AppModule;
    expectedMeta.declaredInDir = expect.any(String);
    expectedMeta.isExternal = undefined;
    expectedMeta.mInitHooks = expect.any(Map);

    expect(mock.normalize(AppModule)).toEqual(expectedMeta);
  });

  it('decoratorOptions -> normalizedModuleMeta: transformation of raw metadata into normalized metadata', () => {
    class Service1 {}
    class Service2 {}
    class Service3 {}
    class Service4 {}
    class Service5 {}
    @injectable()
    class Extension1 implements Extension {
      async stage1() {
        return;
      }
    }

    @featureModule()
    class Module1 {}

    @featureModule()
    class Module2 {}

    const dynamicModule: DynamicModule = { module: Module2, id: 'some-id' };
    const multiProvider: MultiProvider = { token: Service5, useValue: 'some-value', multi: true };

    @rootModule({
      imports: [Module1, dynamicModule],
      providersPerApp: new ProviderBuilder().passThrough(Service1),
      providersPerMod: [Service2, multiProvider],
      providersPerRou: [Service3],
      providersPerReq: [Service4],
      resolvedCollisionsPerApp: [[Service1, Module1]],
      resolvedCollisionsPerMod: [[Service2, Module2]],
      extensions: [{ extension: Extension1, export: true }],
      extensionsMeta: { one: 1 },
      exports: [Service2, Service3, Service4, Service5, Module1],
    })
    class AppModule {}

    const normalizedModuleMeta = mock.normalize(AppModule);
    expect(normalizedModuleMeta.declaredInDir).toEqual(expect.any(String));
    expect(normalizedModuleMeta.importsModules).toEqual([Module1]);
    expect(normalizedModuleMeta.exportsModules).toEqual([Module1]);
    expect(normalizedModuleMeta.importsWithOpts).toEqual([dynamicModule]);
    expect(normalizedModuleMeta.providersPerApp).toEqual([Service1]);
    expect(normalizedModuleMeta.providersPerMod).toEqual([Service2, multiProvider]);
    expect(normalizedModuleMeta.providersPerRou).toEqual([Service3]);
    expect(normalizedModuleMeta.providersPerReq).toEqual([Service4]);
    expect(normalizedModuleMeta.exportedProvidersPerMod).toEqual([Service2]);
    expect(normalizedModuleMeta.exportedProvidersPerRou).toEqual([Service3]);
    expect(normalizedModuleMeta.exportedProvidersPerReq).toEqual([Service4]);
    expect(normalizedModuleMeta.exportedMultiProvidersPerMod).toEqual([multiProvider]);
    expect(normalizedModuleMeta.exportedMultiProvidersPerRou).toEqual([]);
    expect(normalizedModuleMeta.exportedMultiProvidersPerReq).toEqual([]);
    expect(normalizedModuleMeta.resolvedCollisionsPerApp).toEqual([[Service1, Module1]]);
    expect(normalizedModuleMeta.resolvedCollisionsPerMod).toEqual([[Service2, Module2]]);
    expect(normalizedModuleMeta.resolvedCollisionsPerRou).toEqual([]);
    expect(normalizedModuleMeta.resolvedCollisionsPerReq).toEqual([]);
    expect(normalizedModuleMeta.extensionProviders).toEqual([Extension1]);
    expect(normalizedModuleMeta.exportedExtensionProviders).toEqual([Extension1]);
    expect(normalizedModuleMeta.extensionsMeta).toEqual({ one: 1 });
  });

  it('merge static metadata with params', () => {
    class Service1 {}
    class Service2 {}
    class Service3 {}
    class Service4 {}

    @featureModule({
      providersPerApp: new ProviderBuilder().passThrough(Service1),
      providersPerMod: [Service3],
      exports: [Service3],
      extensionsMeta: { one: 1 },
    })
    class Module1 {}

    const normalizedModuleMeta = mock.normalize({
      id: 'some-id',
      module: Module1,
      providersPerApp: [Service2],
      providersPerMod: [Service4],
      extensionsMeta: { two: 2 },
      exports: [Service4],
    });
    expect(normalizedModuleMeta.providersPerApp).toEqual([Service1, Service2]);
    expect(normalizedModuleMeta.providersPerMod).toEqual([Service3, Service4]);
    expect(normalizedModuleMeta.exportedProvidersPerMod).toEqual([Service3, Service4]);
    expect(normalizedModuleMeta.extensionsMeta).toEqual({ one: 1, two: 2 });
    expect(normalizedModuleMeta.id).toEqual('some-id');
  });

  it('import module via static metadata, but export via module params', () => {
    class Service1 {}
    class Service2 {}

    @featureModule({ providersPerMod: [Service1] })
    class Module1 {}

    const dynamicModule: DynamicModule = { module: Module1, exports: [Service1] };
    @featureModule({ imports: [dynamicModule], providersPerMod: [Service2] })
    class Module2 {}

    const normalizedModuleMeta = mock.normalize({ module: Module2, exports: [dynamicModule] });
    expect(normalizedModuleMeta.importsWithOpts).toEqual([dynamicModule]);
    expect(normalizedModuleMeta.exportsWithOpts).toEqual([dynamicModule]);
    expect(normalizedModuleMeta.providersPerMod).toEqual([Service2]);
  });

  it('module reexports another a module without @featureModule decorator', () => {
    class Module1 {}

    @featureModule({ imports: [Module1], exports: [Module1] })
    class Module2 {}

    expect(() => mock.normalize(Module2)).toThrow(new UnknownExport('Module2', 'Module1'));
  });

  it('imports module with params, but exports only a module class (without ref to module with params)', () => {
    class Service1 {}

    @featureModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module1 {}
    const baseDynamicModule: DynamicModule = { module: Module1, providersPerMod: [] };

    @featureModule({
      imports: [baseDynamicModule],
      exports: [Module1],
    })
    class Module2 {}

    expect(() => mock.normalize(Module2)).toThrow(new ReexportFailure('Module2', 'Module1'));
  });

  it('module exported provider from providersPerApp', () => {
    class Service1 {}
    @featureModule({ providersPerApp: [Service1], exports: [Service1] })
    class Module2 {}

    expect(() => mock.normalize(Module2)).toThrow(new ForbiddenAppExport('Module2', 'Service1'));
  });

  it('providers or modules with forwardRef', () => {
    class Service0 {}
    class Service1 {}
    class Service2 {}
    class Service3 {}
    class Service4 {}

    @featureModule({ providersPerApp: [Service0] })
    class Module1 {}

    @featureModule({ providersPerApp: [Service0] })
    class Module2 {}

    const module2WithOpts: DynamicModule = { module: forwardRef(() => Module2) };
    @rootModule({
      imports: [forwardRef(() => Module1), module2WithOpts],
      providersPerApp: [
        forwardRef(() => Service1),
        { token: forwardRef(() => Service3), useClass: forwardRef(() => Service3), multi: true },
      ],
      providersPerMod: [
        forwardRef(() => Service2),
        { token: forwardRef(() => Service4), useToken: forwardRef(() => Service4), multi: true },
      ],
      resolvedCollisionsPerMod: [[forwardRef(() => Service2), forwardRef(() => Module1)]],
      exports: [forwardRef(() => Service2), forwardRef(() => Service4), forwardRef(() => Module1), module2WithOpts],
    })
    class AppModule {}

    const normalizedModuleMeta = mock.normalize(AppModule);
    expect(normalizedModuleMeta.importsModules).toEqual([Module1]);
    expect(normalizedModuleMeta.exportsModules).toEqual([Module1]);
    expect(normalizedModuleMeta.importsWithOpts).toEqual([{ module: Module2 }]);
    expect(normalizedModuleMeta.exportsWithOpts).toEqual([{ module: Module2 }]);
    expect(normalizedModuleMeta.providersPerApp).toEqual([
      Service1,
      { token: Service3, useClass: Service3, multi: true },
    ]);
    expect(normalizedModuleMeta.providersPerMod).toEqual([
      Service2,
      { token: Service4, useToken: Service4, multi: true },
    ]);
    expect(normalizedModuleMeta.exportedProvidersPerMod).toEqual([Service2]);
    expect(normalizedModuleMeta.resolvedCollisionsPerMod).toEqual([[Service2, Module1]]);
    expect(normalizedModuleMeta.exportedMultiProvidersPerMod).toEqual([
      { token: Service4, useToken: Service4, multi: true },
    ]);
  });

  it('resolves forwardRef() in module with params providers', () => {
    class Service1 {}
    class Service2 {}
    class Service3 {}

    @featureModule({
      providersPerMod: [Service1],
      exports: [Service1],
    })
    class Module1 {}

    const dynamicModule: DynamicModule = {
      module: forwardRef(() => Module1),
      providersPerMod: [
        forwardRef(() => Service2),
        { token: forwardRef(() => Service3), useClass: forwardRef(() => Service3) },
      ],
      exports: [forwardRef(() => Service2), forwardRef(() => Service3)],
    };

    const normalizedModuleMeta = mock.normalize(dynamicModule);
    expect(normalizedModuleMeta.name).toBe('Module1-DynamicModule');
    expect(normalizedModuleMeta.providersPerMod).toEqual([Service1, Service2, { token: Service3, useClass: Service3 }]);
    expect(normalizedModuleMeta.exportedProvidersPerMod).toEqual([
      Service1,
      Service2,
      { token: Service3, useClass: Service3 },
    ]);
  });

  it('module exports a normalized provider', () => {
    class Service1 {}
    @featureModule({ providersPerMod: [Service1], exports: [{ token: Service1, useClass: Service1 }] })
    class Module2 {}

    expect(() => mock.normalize(Module2)).toThrow(new ForbiddenNormalizedExport('Module2', 'Service1'));
  });

  it('exports module without imports it', () => {
    class Service1 {}
    @featureModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module1 {}

    @featureModule({ exports: [Module1] })
    class Module2 {}

    expect(() => mock.normalize(Module2)).toThrow(new ReexportFailure('Module2', 'Module1'));
  });

  it('module exports an invalid extension', () => {
    @injectable()
    class Extension1 {}

    @featureModule({ extensions: [{ extension: Extension1, export: true }] })
    class Module2 {}

    expect(() => mock.normalize(Module2)).toThrow(new InvalidExtension('Module2', 'Extension1'));
  });

  it('module exports a valid extension', () => {
    @injectable()
    class Extension1 implements Extension {
      async stage1() {}
    }

    @featureModule({ extensions: [{ extension: Extension1, export: true }] })
    class Module2 {}

    expect(() => mock.normalize(Module2)).not.toThrow();
    const normalizedModuleMeta = mock.normalize(Module2);
    expect(normalizedModuleMeta.extensionProviders).toEqual([Extension1]);
    expect(normalizedModuleMeta.exportedExtensionProviders).toEqual([Extension1]);
  });

  describe('creating custom decorator with init hooks', () => {
    /**
     * An object with this type will be passed in the module metadata as a so-called "module with parameters".
     */
    interface InitParams extends DynamicModuleOptions {
      path?: string;
      num?: number;
    }

    /**
     * An object with this type will be passed directly to the init decorator.
     */
    interface RootDecoratorOptions extends BaseInitDecoratorOptions<InitParams> {
      one?: number;
      two?: number;
      appends?: ({ module: ModRefId } & AnyObj)[];
    }

    /**
     * Init hooks transform an object of type {@link RootDecoratorOptions} into an object of that type.
     */
    class InitMeta extends NormalizedInitMeta {
      normalizedModuleMeta: NormalizedModuleMeta;
      initDecoratorOptions: RootDecoratorOptions;
    }

    /**
     * The methods of this class will normalize and validate the metadata passed to the init decorator.
     */
    class InitHooks1 extends InitHooks<RootDecoratorOptions> {
      override normalize(normalizedModuleMeta: NormalizedModuleMeta) {
        const meta = getProxyForInitMeta(normalizedModuleMeta, InitMeta);

        // Add arbitrary metadata declared in InitMeta
        meta.normalizedModuleMeta = normalizedModuleMeta;
        meta.initDecoratorOptions = this.decoratorOptions;
        return meta;
      }
    }

    /**
     * Init decorator transformer.
     */
    function getInitHooks(data?: RootDecoratorOptions): InitHooks<RootDecoratorOptions> {
      const metadata = Object.assign({}, data);
      return new InitHooks1(metadata);
    }

    const initSome: InitDecorator<RootDecoratorOptions, InitParams, InitMeta> = Reflector.makeClassDecorator(
      getInitHooks,
      'initSome',
    );

    it('during import MWP, merge existing init params with new init params', () => {
      class Service1 {}
      class Service2 {}
      class Service3 {}

      @featureModule()
      class Module1 {}

      @featureModule()
      class Module2 {}

      const mwp1: DynamicModuleWithInit & InitParams = {
        module: Module1,
        providersPerMod: [Service1],
        providersPerApp: [Service3],
        extensionsMeta: { one: 1 },
        num: 4,
        initParams: new Map(),
      };
      mwp1.initParams.set(initSome, { path: 'path-1' });

      const mwp2: DynamicModuleWithInit & InitParams = {
        module: Module2,
        providersPerApp: [Service2],
        num: 12,
        extensionsMeta: { four: 4 },
        initParams: new Map(),
      };
      mwp2.initParams.set(initSome, {
        path: 'path-2',
        providersPerApp: [Service1],
        num: 11,
        extensionsMeta: { three: 3 },
      });

      @initSome({
        imports: [{ dynamicModule: mwp1, providersPerMod: [Service2], extensionsMeta: { two: 2 }, num: 5 }, mwp2],
      })
      @rootModule()
      class AppModule {}

      mock.normalize(AppModule);
      expect(mwp1.initParams?.get(initSome)).toEqual<InitParams>({
        path: 'path-1',
        providersPerMod: [Service1, Service2],
        extensionsMeta: { one: 1, two: 2 },
        num: 5,
        providersPerApp: [Service3],
      });
      expect(mwp2.initParams?.get(initSome)).toEqual<InitParams>({
        providersPerApp: [Service1, Service2],
        num: 12,
        extensionsMeta: { three: 3, four: 4 },
        path: 'path-2',
      });
    });

    it('initHooks.normalize() correctly works', () => {
      const decoratorOptions: RootDecoratorOptions = { one: 1, two: 2 };

      @initSome(decoratorOptions)
      @featureModule()
      class Module1 {}

      const normalizedModuleMeta = mock.normalize(Module1).initMeta.get(initSome);
      expect(normalizedModuleMeta?.normalizedModuleMeta.modRefId).toBe(Module1);
      expect(normalizedModuleMeta?.initDecoratorOptions).toEqual(decoratorOptions);
    });

    it('proprly works with imports/exports of modules', () => {
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

      const normalizedModuleMeta = mock.normalize(AppModule);
      expect(normalizedModuleMeta.importsModules).toEqual([Module1]);
      expect(normalizedModuleMeta.exportsModules).toEqual([Module1]);
      expect(normalizedModuleMeta.importsWithOpts).toEqual<DynamicModule[]>([
        dynamicModule2,
        { module: Module3, initParams: expect.any(Map) },
        dynamicModule4,
      ]);
      expect(normalizedModuleMeta.exportsWithOpts).toEqual([dynamicModule2, dynamicModule4]);
    });

    it('proprly works with imports/exports and forwardRef() with modules', () => {
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

      const normalizedModuleMeta = mock.normalize(AppModule);
      expect(normalizedModuleMeta.importsModules).toEqual([Module1]);
      expect(normalizedModuleMeta.importsWithOpts).toEqual<DynamicModule[]>([
        dynamicModule2,
        { module: Module3, initParams: expect.any(Map) },
        dynamicModule4,
      ]);
      expect(normalizedModuleMeta.exportsModules).toEqual([Module1]);
      expect(normalizedModuleMeta.exportsWithOpts).toEqual([dynamicModule2, dynamicModule4]);
      expect(dynamicModule2.module).toBe(Module2);
      expect(dynamicModule4.module).toBe(Module4);
    });
  });

  describe('validation errors', () => {
    it('throws InvalidModRefId for a non-class argument', () => {
      expect(() => mock.normalize({} as ModRefId)).toThrow(new InvalidModRefId());
    });

    it('throws MissingModuleDecorator for a class without decorator', () => {
      class UndecoratedModule {}

      expect(() => mock.normalize(UndecoratedModule)).toThrow(new MissingModuleDecorator('UndecoratedModule'));
    });

    it('throws UndefinedSymbol when imports contain undefined', () => {
      @featureModule({ imports: [undefined as any], providersPerMod: [{ token: 't', useValue: 1 }], exports: ['t'] })
      class Module1 {}

      expect(() => mock.normalize(Module1)).toThrow(new UndefinedSymbol('Imports', 'Module1', 0));
    });

    it('throws UndefinedSymbol when exports contain undefined', () => {
      class Service1 {}

      @featureModule({ providersPerMod: [Service1], exports: [undefined as any] })
      class Module1 {}

      expect(() => mock.normalize(Module1)).toThrow(new UndefinedSymbol('Exports', 'Module1', 0));
    });

    it('throws UndefinedSymbol when exports with params contain undefined', () => {
      class Service1 {}

      @featureModule({ providersPerMod: [Service1], exports: [Service1] })
      class Module1 {}

      expect(() => mock.normalize({ module: Module1, exports: [undefined as any] })).toThrow(
        new UndefinedSymbol('Exports with params', 'Module1-DynamicModule', 0),
      );
    });

    it('throws ResolvedCollisionTokensOnly for normalized provider in resolvedCollisionsPerMod', () => {
      class Service1 {}

      @featureModule({
        providersPerMod: [Service1],
        resolvedCollisionsPerMod: [[{ token: Service1, useClass: Service1 }, Module1]],
        exports: [Service1],
      })
      class Module1 {}

      expect(() => mock.normalize(Module1)).toThrow(new ResolvedCollisionTokensOnly('Module1', 'Service1'));
    });

    it('throws EmptyModuleMetadata for empty feature module', () => {
      @featureModule()
      class EmptyModule {}

      expect(() => mock.normalize(EmptyModule)).toThrow(new EmptyModuleMetadata());
    });

    it('does not throw EmptyModuleMetadata for empty root module', () => {
      @rootModule()
      class AppModule {}

      expect(() => mock.normalize(AppModule)).not.toThrow();
    });

    it('throws UnknownExport when exporting undeclared provider token', () => {
      class Service1 {}
      class Service2 {}

      @featureModule({ providersPerMod: [Service1], exports: [Service2] })
      class Module1 {}

      expect(() => mock.normalize(Module1)).toThrow(new UnknownExport('Module1', 'Service2'));
    });
  });

  describe('providers per Rou and Req levels', () => {
    it('normalizes providers and resolved collisions for Rou and Req levels', () => {
      class Service1 {}
      class Service2 {}
      class Service3 {}
      class Service4 {}

      @featureModule()
      class Module1 {}

      @featureModule()
      class Module2 {}

      @rootModule({
        providersPerRou: [Service1],
        providersPerReq: [Service2],
        resolvedCollisionsPerRou: [[Service1, Module1]],
        resolvedCollisionsPerReq: [[Service2, Module2]],
        exports: [Service1, Service2],
      })
      class AppModule {}

      const normalizedModuleMeta = mock.normalize(AppModule);
      expect(normalizedModuleMeta.providersPerRou).toEqual([Service1]);
      expect(normalizedModuleMeta.providersPerReq).toEqual([Service2]);
      expect(normalizedModuleMeta.resolvedCollisionsPerRou).toEqual([[Service1, Module1]]);
      expect(normalizedModuleMeta.resolvedCollisionsPerReq).toEqual([[Service2, Module2]]);
      expect(normalizedModuleMeta.exportedProvidersPerRou).toEqual([Service1]);
      expect(normalizedModuleMeta.exportedProvidersPerReq).toEqual([Service2]);
    });
  });

  describe('extensions', () => {
    it('prefers module with params extensionsMeta over static extensionsMeta', () => {
      class Service1 {}

      @featureModule({
        extensionsMeta: { one: 1, shared: 'static' },
        providersPerMod: [Service1],
        exports: [Service1],
      })
      class Module1 {}

      const normalizedModuleMeta = mock.normalize({
        module: Module1,
        extensionsMeta: { two: 2, shared: 'params' },
      });

      expect(normalizedModuleMeta.extensionsMeta).toEqual({ one: 1, shared: 'params', two: 2 });
    });

    it('accepts extension with stage2() only', () => {
      @injectable()
      class Extension1 implements Extension {
        async stage2() {}
      }

      class Service1 {}

      @featureModule({
        extensions: [Extension1],
        providersPerMod: [Service1],
        exports: [Service1],
      })
      class Module1 {}

      expect(() => mock.normalize(Module1)).not.toThrow();
    });

    it('accepts extension with stage3() only', () => {
      @injectable()
      class Extension1 implements Extension {
        async stage3() {}
      }

      class Service1 {}

      @featureModule({
        extensions: [Extension1],
        providersPerMod: [Service1],
        exports: [Service1],
      })
      class Module1 {}

      expect(() => mock.normalize(Module1)).not.toThrow();
    });

    it('normalizes extension groups', () => {
      @injectable()
      class Extension1 implements Extension {
        async stage1() {}
      }

      @injectable()
      class Extension2 implements Extension {
        async stage1() {}
      }

      class Service1 {}

      @featureModule({
        extensions: [{ extension: Extension1, groups: [Extension2] }],
        providersPerMod: [Service1],
        exports: [Service1],
      })
      class Module1 {}

      const normalizedModuleMeta = mock.normalize(Module1);
      const groupToken = KeyRegistry.getGroupToken(Extension2);
      expect(normalizedModuleMeta.extensionProviders).toEqual([
        { token: groupToken, useToken: Extension2, multi: true },
        Extension1,
        { token: groupToken, useToken: Extension1, multi: true },
      ]);
      expect(normalizedModuleMeta.mExtensionAsGroupToken.get(Extension2)).toBe(groupToken);
    });

    it('normalizes exportOnly extension', () => {
      @injectable()
      class Extension1 implements Extension {
        async stage1() {}
      }

      class Service1 {}

      @featureModule({
        extensions: [{ extension: Extension1, exportOnly: true }],
        providersPerMod: [Service1],
        exports: [Service1],
      })
      class Module1 {}

      const normalizedModuleMeta = mock.normalize(Module1);
      expect(normalizedModuleMeta.extensionProviders).toEqual([]);
      expect(normalizedModuleMeta.exportedExtensionProviders).toEqual([Extension1]);
      expect(normalizedModuleMeta.aExportedExtensionConfig).toHaveLength(1);
    });
  });

  describe('init hooks', () => {
    interface InitDecoratorOptions extends BaseInitDecoratorOptions<{ path?: string }> {
      flag?: boolean;
    }

    interface InitMeta extends NormalizedInitMeta {
      flag?: boolean;
      path?: string;
      modRefId?: ModRefId;
    }

    class InitHooks1 extends InitHooks<InitDecoratorOptions> {
      override normalize(normalizedModuleMeta: NormalizedModuleMeta): InitMeta {
        if (isDynamicModule(normalizedModuleMeta.modRefId)) {
          const params = normalizedModuleMeta.modRefId.initParams?.get(initSome);
          return { path: params?.path, modRefId: normalizedModuleMeta.modRefId } as InitMeta;
        }

        return { flag: this.decoratorOptions.flag, modRefId: normalizedModuleMeta.modRefId } as InitMeta;
      }
    }

    const initSome: InitDecorator<InitDecoratorOptions, { path?: string }, InitMeta> = Reflector.makeClassDecorator(
      (data) => new InitHooks1(data),
    );

    it('adds init hooks to host module via allInitHooks and hostDecoratorOptions', () => {
      @featureModule()
      class HostModule {}

      class HostInitHooks extends InitHooks<InitDecoratorOptions> {
        override hostModule = HostModule;
        override hostDecoratorOptions = { flag: true };

        override normalize(normalizedModuleMeta: NormalizedModuleMeta): InitMeta {
          return { flag: this.decoratorOptions.flag, modRefId: normalizedModuleMeta.modRefId } as InitMeta;
        }
      }

      const hostInitSome: InitDecorator<InitDecoratorOptions, {}, {}> = Reflector.makeClassDecorator(
        (data) => new HostInitHooks(data),
      );
      const allInitHooks = new Map([[hostInitSome, new HostInitHooks({})]]);

      const normalizedModuleMeta = mock.normalize(HostModule, allInitHooks);
      expect(normalizedModuleMeta.mInitHooks.has(hostInitSome)).toBe(true);
      expect(normalizedModuleMeta.initMeta.get(hostInitSome)).toEqual({ flag: true, modRefId: HostModule });
    });

    it('imports hostModule when init decorator declares it', () => {
      @featureModule()
      class HostModule {}

      class HostInitHooks extends InitHooks<InitDecoratorOptions> {
        override hostModule = HostModule;
      }

      const hostInitSome: InitDecorator<InitDecoratorOptions, {}, {}> = Reflector.makeClassDecorator(
        (data) => new HostInitHooks(data),
      );

      class Service1 {}

      @hostInitSome({})
      @featureModule({ providersPerMod: [Service1], exports: [Service1] })
      class Module1 {}

      const normalizedModuleMeta = mock.normalize(Module1);
      expect(normalizedModuleMeta.importsModules).toContain(HostModule);
    });

    it('adds init hooks for imported module with params without init decorator on module class', () => {
      class Service1 {}

      @featureModule({ providersPerApp: [Service1] })
      class Module1 {}

      const dynamicModule: DynamicModule = { module: Module1 };
      const allInitHooks = new Map([[initSome, new InitHooks1({})]]);

      @initSome({ imports: [{ dynamicModule: dynamicModule, path: 'prefix' }] })
      @rootModule()
      class AppModule {}

      mock.normalize(AppModule);

      const normalizedModuleMeta = mock.normalize(dynamicModule, allInitHooks);
      expect(normalizedModuleMeta.initMeta.get(initSome)).toEqual({ path: 'prefix', modRefId: dynamicModule });
    });
  });

  describe('checkAndMarkExternalModule()', () => {
    class ExternalModuleNormalizer extends ModuleNormalizer {
      customMeta = new Map<any, DecoratorMeta[]>();

      override normalize(modRefId: any, allInitHooks = new Map()): NormalizedModuleMeta {
        return super.normalize(modRefId, allInitHooks);
      }

      protected override getDecoratorMeta(modRefId: any) {
        return this.customMeta.get(modRefId);
      }
    }

    it('should mark external modules correctly based on declaredInDir and rootDeclaredInDir', () => {
      const normalizer = new ExternalModuleNormalizer();
      class AppModule {}
      class ExternalModule {}
      class InternalModule {}

      const dummyDecorator = () => {};

      // Set root module
      const rootMetaVal = new RootDecoratorOptions();
      const rootDec = new DecoratorMeta(dummyDecorator, rootMetaVal, undefined, '/user-project/src');
      normalizer.customMeta.set(AppModule, [rootDec]);

      // External module outside /user-project/src
      const extMetaVal = Object.assign(new ModuleDecoratorOptions(), {
        providersPerApp: [{ token: 't', useValue: 1 }],
      });
      const extDec = new DecoratorMeta(dummyDecorator, extMetaVal, undefined, '/node_modules/external-mod');
      normalizer.customMeta.set(ExternalModule, [extDec]);

      // Internal module inside /user-project/src
      const intMetaVal = Object.assign(new ModuleDecoratorOptions(), {
        providersPerApp: [{ token: 't', useValue: 1 }],
      });
      const intDec = new DecoratorMeta(
        dummyDecorator,
        intMetaVal,
        undefined,
        '/user-project/src/features/internal-mod',
      );
      normalizer.customMeta.set(InternalModule, [intDec]);

      const rootMeta = normalizer.normalize(AppModule);
      expect(rootMeta.isExternal).toBeUndefined();

      const extMeta = normalizer.normalize(ExternalModule);
      expect(extMeta.isExternal).toBe(true);

      const intMeta = normalizer.normalize(InternalModule);
      expect(intMeta.isExternal).toBe(false);
    });

    it('should mark ditsmod package module as external if root is not in ditsmod/packages', () => {
      const normalizer = new ExternalModuleNormalizer();
      class AppModule {}
      class DitsmodModule {}

      const dummyDecorator = () => {};

      const rootDec = new DecoratorMeta(dummyDecorator, new RootDecoratorOptions(), undefined, '/user-project/src');
      normalizer.customMeta.set(AppModule, [rootDec]);

      const ditsmodMetaVal = Object.assign(new ModuleDecoratorOptions(), {
        providersPerApp: [{ token: 't', useValue: 1 }],
      });
      const ditsmodDec = new DecoratorMeta(
        dummyDecorator,
        ditsmodMetaVal,
        undefined,
        '/user-project/node_modules/ditsmod/packages/core',
      );
      normalizer.customMeta.set(DitsmodModule, [ditsmodDec]);

      normalizer.normalize(AppModule);
      const ditsmodMeta = normalizer.normalize(DitsmodModule);
      expect(ditsmodMeta.isExternal).toBe(true);
    });
  });
});
