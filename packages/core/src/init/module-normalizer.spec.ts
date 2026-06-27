import { featureModule } from '#decorators/feature-module.js';
import { BaseInitRawMeta, InitHooks, InitDecorator } from '#decorators/init-hooks-and-metadata.js';
import { BaseInitMeta, getProxyForInitMeta, BaseMeta } from '#init/base-meta.js';
import { rootModule, RootRawMetadata } from '#decorators/root-module.js';
import { Reflector } from '#di/reflector.js';
import { Extension } from '#extension/extension-types.js';
import { AnyObj, ModRefId } from '#types/mix.js';
import { FeatureModuleParams, ModuleRawMetadata, ModuleWithInitParams, ModuleWithParams } from '#decorators/module-raw-metadata.js';
import { clearDebugClassNames } from '#utils/get-debug-class-name.js';
import { ModuleNormalizer } from './module-normalizer.js';
import { Providers } from '#utils/providers.js';
import {
  ExportingUnknownSymbol,
  ForbiddenExportNormalizedProvider,
  ForbiddenExportProvidersPerApp,
  InvalidExtension,
  InvalidModRefId,
  ModuleDoesNotHaveDecorator,
  ModuleShouldHaveValue,
  ReexportFailed,
  ResolvedCollisionTokensOnly,
  UndefinedSymbol,
} from '#error/core-errors.js';
import { injectable } from '#di/decorators.js';
import type { MultiProvider } from '#di/utils.js';
import { forwardRef } from '#di/forward-ref.js';
import { KeyRegistry } from '#di/key-registry.js';
import { isModuleWithParams } from '#decorators/type-guards.js';
import { DecoratorAndValue } from '#di/top/decorator-and-value.js';

describe('ModuleNormalizer', () => {
  class MockModuleNormalizer extends ModuleNormalizer {
    override normalize(modRefId: ModRefId, allInitHooks = new Map()): BaseMeta {
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

    const expectedMeta = new BaseMeta();
    expectedMeta.id = '';
    expectedMeta.name = 'AppModule';
    expectedMeta.rawMeta = new RootRawMetadata();
    expectedMeta.modRefId = AppModule;
    expectedMeta.declaredInDir = expect.any(String);
    expectedMeta.isExternal = undefined;
    expectedMeta.mInitHooks = expect.any(Map);

    expect(mock.normalize(AppModule)).toEqual(expectedMeta);
  });

  it('rawMeta -> baseMeta: transformation of raw metadata into normalized metadata', () => {
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

    const moduleWithParams: ModuleWithParams = { module: Module2, id: 'some-id' };
    const multiProvider: MultiProvider = { token: Service5, useValue: 'some-value', multi: true };

    @rootModule({
      imports: [Module1, moduleWithParams],
      providersPerApp: new Providers().passThrough(Service1),
      providersPerMod: [Service2, multiProvider],
      providersPerRou: [Service3],
      providersPerReq: [Service4],
      resolvedCollisionPerApp: [[Service1, Module1]],
      resolvedCollisionPerMod: [[Service2, Module2]],
      extensions: [{ extension: Extension1, export: true }],
      extensionsMeta: { one: 1 },
      exports: [Service2, Service3, Service4, Service5, Module1],
    })
    class AppModule {}

    const baseMeta = mock.normalize(AppModule);
    expect(baseMeta.declaredInDir).toEqual(expect.any(String));
    expect(baseMeta.importsModules).toEqual([Module1]);
    expect(baseMeta.exportsModules).toEqual([Module1]);
    expect(baseMeta.importsWithParams).toEqual([moduleWithParams]);
    expect(baseMeta.providersPerApp).toEqual([Service1]);
    expect(baseMeta.providersPerMod).toEqual([Service2, multiProvider]);
    expect(baseMeta.providersPerRou).toEqual([Service3]);
    expect(baseMeta.providersPerReq).toEqual([Service4]);
    expect(baseMeta.exportedProvidersPerMod).toEqual([Service2]);
    expect(baseMeta.exportedProvidersPerRou).toEqual([Service3]);
    expect(baseMeta.exportedProvidersPerReq).toEqual([Service4]);
    expect(baseMeta.exportedMultiProvidersPerMod).toEqual([multiProvider]);
    expect(baseMeta.exportedMultiProvidersPerRou).toEqual([]);
    expect(baseMeta.exportedMultiProvidersPerReq).toEqual([]);
    expect(baseMeta.resolvedCollisionPerApp).toEqual([[Service1, Module1]]);
    expect(baseMeta.resolvedCollisionPerMod).toEqual([[Service2, Module2]]);
    expect(baseMeta.resolvedCollisionPerRou).toEqual([]);
    expect(baseMeta.resolvedCollisionPerReq).toEqual([]);
    expect(baseMeta.extensionProviders).toEqual([Extension1]);
    expect(baseMeta.exportedExtensionProviders).toEqual([Extension1]);
    expect(baseMeta.extensionsMeta).toEqual({ one: 1 });
  });

  it('merge static metadata with params', () => {
    class Service1 {}
    class Service2 {}
    class Service3 {}
    class Service4 {}

    @featureModule({
      providersPerApp: new Providers().passThrough(Service1),
      providersPerMod: [Service3],
      exports: [Service3],
      extensionsMeta: { one: 1 },
    })
    class Module1 {}

    const baseMeta = mock.normalize({
      id: 'some-id',
      module: Module1,
      providersPerApp: [Service2],
      providersPerMod: [Service4],
      extensionsMeta: { two: 2 },
      exports: [Service4],
    });
    expect(baseMeta.providersPerApp).toEqual([Service1, Service2]);
    expect(baseMeta.providersPerMod).toEqual([Service3, Service4]);
    expect(baseMeta.exportedProvidersPerMod).toEqual([Service3, Service4]);
    expect(baseMeta.extensionsMeta).toEqual({ one: 1, two: 2 });
    expect(baseMeta.id).toEqual('some-id');
  });

  it('import module via static metadata, but export via module params', () => {
    class Service1 {}
    class Service2 {}

    @featureModule({ providersPerMod: [Service1] })
    class Module1 {}

    const moduleWithParams: ModuleWithParams = { module: Module1, exports: [Service1] };
    @featureModule({ imports: [moduleWithParams], providersPerMod: [Service2] })
    class Module2 {}

    const baseMeta = mock.normalize({ module: Module2, exports: [moduleWithParams] });
    expect(baseMeta.importsWithParams).toEqual([moduleWithParams]);
    expect(baseMeta.exportsWithParams).toEqual([moduleWithParams]);
    expect(baseMeta.providersPerMod).toEqual([Service2]);
  });

  it('module reexports another a module without @featureModule decorator', () => {
    class Module1 {}

    @featureModule({ imports: [Module1], exports: [Module1] })
    class Module2 {}

    expect(() => mock.normalize(Module2)).toThrow(new ExportingUnknownSymbol('Module2', 'Module1'));
  });

  it('imports module with params, but exports only a module class (without ref to module with params)', () => {
    class Service1 {}

    @featureModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module1 {}
    const baseModuleWithParams: ModuleWithParams = { module: Module1, providersPerMod: [] };

    @featureModule({
      imports: [baseModuleWithParams],
      exports: [Module1],
    })
    class Module2 {}

    expect(() => mock.normalize(Module2)).toThrow(new ReexportFailed('Module2', 'Module1'));
  });

  it('module exported provider from providersPerApp', () => {
    class Service1 {}
    @featureModule({ providersPerApp: [Service1], exports: [Service1] })
    class Module2 {}

    expect(() => mock.normalize(Module2)).toThrow(new ForbiddenExportProvidersPerApp('Module2', 'Service1'));
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

    const module2WithParams: ModuleWithParams = { module: forwardRef(() => Module2) };
    @rootModule({
      imports: [forwardRef(() => Module1), module2WithParams],
      providersPerApp: [
        forwardRef(() => Service1),
        { token: forwardRef(() => Service3), useClass: forwardRef(() => Service3), multi: true },
      ],
      providersPerMod: [
        forwardRef(() => Service2),
        { token: forwardRef(() => Service4), useToken: forwardRef(() => Service4), multi: true },
      ],
      resolvedCollisionPerMod: [[forwardRef(() => Service2), forwardRef(() => Module1)]],
      exports: [forwardRef(() => Service2), forwardRef(() => Service4), forwardRef(() => Module1), module2WithParams],
    })
    class AppModule {}

    const baseMeta = mock.normalize(AppModule);
    expect(baseMeta.importsModules).toEqual([Module1]);
    expect(baseMeta.exportsModules).toEqual([Module1]);
    expect(baseMeta.importsWithParams).toEqual([{ module: Module2 }]);
    expect(baseMeta.exportsWithParams).toEqual([{ module: Module2 }]);
    expect(baseMeta.providersPerApp).toEqual([Service1, { token: Service3, useClass: Service3, multi: true }]);
    expect(baseMeta.providersPerMod).toEqual([Service2, { token: Service4, useToken: Service4, multi: true }]);
    expect(baseMeta.exportedProvidersPerMod).toEqual([Service2]);
    expect(baseMeta.resolvedCollisionPerMod).toEqual([[Service2, Module1]]);
    expect(baseMeta.exportedMultiProvidersPerMod).toEqual([{ token: Service4, useToken: Service4, multi: true }]);
  });

  it('module exports a normalized provider', () => {
    class Service1 {}
    @featureModule({ providersPerMod: [Service1], exports: [{ token: Service1, useClass: Service1 }] })
    class Module2 {}

    expect(() => mock.normalize(Module2)).toThrow(new ForbiddenExportNormalizedProvider('Module2', 'Service1'));
  });

  it('exports module without imports it', () => {
    class Service1 {}
    @featureModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module1 {}

    @featureModule({ exports: [Module1] })
    class Module2 {}

    expect(() => mock.normalize(Module2)).toThrow(new ReexportFailed('Module2', 'Module1'));
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
    const baseMeta = mock.normalize(Module2);
    expect(baseMeta.extensionProviders).toEqual([Extension1]);
    expect(baseMeta.exportedExtensionProviders).toEqual([Extension1]);
  });

  describe('creating custom decorator with init hooks', () => {
    /**
     * An object with this type will be passed in the module metadata as a so-called "module with parameters".
     */
    interface InitParams extends FeatureModuleParams {
      path?: string;
      num?: number;
    }

    /**
     * An object with this type will be passed directly to the init decorator.
     */
    interface RootRawMetadata extends BaseInitRawMeta<InitParams> {
      one?: number;
      two?: number;
      appends?: ({ module: ModRefId } & AnyObj)[];
    }

    /**
     * Init hooks transform an object of type {@link RootRawMetadata} into an object of that type.
     */
    class InitMeta extends BaseInitMeta {
      baseMeta: BaseMeta;
      initRawMeta: RootRawMetadata;
    }

    /**
     * The methods of this class will normalize and validate the metadata passed to the init decorator.
     */
    class InitHooks1 extends InitHooks<RootRawMetadata> {
      override normalize(baseMeta: BaseMeta) {
        const meta = getProxyForInitMeta(baseMeta, InitMeta);

        // Add arbitrary metadata declared in InitMeta
        meta.baseMeta = baseMeta;
        meta.initRawMeta = this.rawMeta;
        return meta;
      }
    }

    /**
     * Init decorator transformer.
     */
    function getInitHooks(data?: RootRawMetadata): InitHooks<RootRawMetadata> {
      const metadata = Object.assign({}, data);
      return new InitHooks1(metadata);
    }

    const initSome: InitDecorator<RootRawMetadata, InitParams, InitMeta> = Reflector.makeClassDecorator(
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

      const mwp1: ModuleWithInitParams & InitParams = {
        module: Module1,
        providersPerMod: [Service1],
        providersPerApp: [Service3],
        extensionsMeta: { one: 1 },
        num: 4,
        initParams: new Map(),
      };
      mwp1.initParams.set(initSome, { path: 'path-1' });

      const mwp2: ModuleWithInitParams & InitParams = {
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
        imports: [{ mwp: mwp1, providersPerMod: [Service2], extensionsMeta: { two: 2 }, num: 5 }, mwp2],
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
      const rawMeta: RootRawMetadata = { one: 1, two: 2 };

      @initSome(rawMeta)
      @featureModule()
      class Module1 {}

      const baseMeta = mock.normalize(Module1).initMeta.get(initSome);
      expect(baseMeta?.baseMeta.modRefId).toBe(Module1);
      expect(baseMeta?.initRawMeta).toEqual(rawMeta);
    });

    it('proprly works with imports/exports of modules', () => {
      class Service1 {}

      @featureModule({ providersPerApp: [Service1] })
      class Module1 {}

      @featureModule({ providersPerApp: [Service1] })
      class Module2 {}
      const moduleWithParams2: ModuleWithParams = { module: Module2 };

      @featureModule({ providersPerApp: [Service1] })
      class Module3 {}

      @featureModule({ providersPerApp: [Service1] })
      class Module4 {}
      const moduleWithParams4: ModuleWithParams = { module: Module4 };

      @initSome({
        imports: [Module1, moduleWithParams2, { module: Module3 }, { mwp: moduleWithParams4 }],
        exports: [Module1, moduleWithParams2, moduleWithParams4],
      })
      @rootModule()
      class AppModule {}

      const baseMeta = mock.normalize(AppModule);
      expect(baseMeta.importsModules).toEqual([Module1]);
      expect(baseMeta.exportsModules).toEqual([Module1]);
      expect(baseMeta.importsWithParams).toEqual<ModuleWithParams[]>([
        moduleWithParams2,
        { module: Module3, initParams: expect.any(Map) },
        moduleWithParams4,
      ]);
      expect(baseMeta.exportsWithParams).toEqual([moduleWithParams2, moduleWithParams4]);
    });

    it('proprly works with imports/exports and forwardRef() with modules', () => {
      class Service1 {}

      @featureModule({ providersPerApp: [Service1] })
      class Module1 {}

      @featureModule({ providersPerApp: [Service1] })
      class Module2 {}
      const moduleWithParams2: ModuleWithParams = { module: forwardRef(() => Module2) };

      @featureModule({ providersPerApp: [Service1] })
      class Module3 {}

      @featureModule({ providersPerApp: [Service1] })
      class Module4 {}
      const moduleWithParams4: ModuleWithParams = { module: forwardRef(() => Module4) };

      @initSome({
        imports: [
          forwardRef(() => Module1),
          moduleWithParams2,
          { module: forwardRef(() => Module3) },
          { mwp: moduleWithParams4 },
        ],
        exports: [forwardRef(() => Module1), moduleWithParams2, moduleWithParams4],
      })
      @rootModule()
      class AppModule {}

      const baseMeta = mock.normalize(AppModule);
      expect(baseMeta.importsModules).toEqual([Module1]);
      expect(baseMeta.importsWithParams).toEqual<ModuleWithParams[]>([
        moduleWithParams2,
        { module: Module3, initParams: expect.any(Map) },
        moduleWithParams4,
      ]);
      expect(baseMeta.exportsModules).toEqual([Module1]);
      expect(baseMeta.exportsWithParams).toEqual([moduleWithParams2, moduleWithParams4]);
      expect(moduleWithParams2.module).toBe(Module2);
      expect(moduleWithParams4.module).toBe(Module4);
    });
  });


  describe('validation errors', () => {
    it('throws InvalidModRefId for a non-class argument', () => {
      expect(() => mock.normalize({} as ModRefId)).toThrow(new InvalidModRefId());
    });

    it('throws ModuleDoesNotHaveDecorator for a class without decorator', () => {
      class UndecoratedModule {}

      expect(() => mock.normalize(UndecoratedModule)).toThrow(new ModuleDoesNotHaveDecorator('UndecoratedModule'));
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
        new UndefinedSymbol('Exports with params', 'Module1-WithParams', 0),
      );
    });

    it('throws ResolvedCollisionTokensOnly for normalized provider in resolvedCollisionPerMod', () => {
      class Service1 {}

      @featureModule({
        providersPerMod: [Service1],
        resolvedCollisionPerMod: [[{ token: Service1, useClass: Service1 }, Module1]],
        exports: [Service1],
      })
      class Module1 {}

      expect(() => mock.normalize(Module1)).toThrow(new ResolvedCollisionTokensOnly('Module1', 'Service1'));
    });

    it('throws ModuleShouldHaveValue for empty feature module', () => {
      @featureModule()
      class EmptyModule {}

      expect(() => mock.normalize(EmptyModule)).toThrow(new ModuleShouldHaveValue());
    });

    it('does not throw ModuleShouldHaveValue for empty root module', () => {
      @rootModule()
      class AppModule {}

      expect(() => mock.normalize(AppModule)).not.toThrow();
    });

    it('throws ExportingUnknownSymbol when exporting undeclared provider token', () => {
      class Service1 {}
      class Service2 {}

      @featureModule({ providersPerMod: [Service1], exports: [Service2] })
      class Module1 {}

      expect(() => mock.normalize(Module1)).toThrow(new ExportingUnknownSymbol('Module1', 'Service2'));
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
        resolvedCollisionPerRou: [[Service1, Module1]],
        resolvedCollisionPerReq: [[Service2, Module2]],
        exports: [Service1, Service2],
      })
      class AppModule {}

      const baseMeta = mock.normalize(AppModule);
      expect(baseMeta.providersPerRou).toEqual([Service1]);
      expect(baseMeta.providersPerReq).toEqual([Service2]);
      expect(baseMeta.resolvedCollisionPerRou).toEqual([[Service1, Module1]]);
      expect(baseMeta.resolvedCollisionPerReq).toEqual([[Service2, Module2]]);
      expect(baseMeta.exportedProvidersPerRou).toEqual([Service1]);
      expect(baseMeta.exportedProvidersPerReq).toEqual([Service2]);
    });
  });

  describe('extensions', () => {
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

      const baseMeta = mock.normalize(Module1);
      const groupToken = KeyRegistry.getGroupToken(Extension2);
      expect(baseMeta.extensionProviders).toEqual([
        { token: groupToken, useToken: Extension2, multi: true },
        Extension1,
        { token: groupToken, useToken: Extension1, multi: true },
      ]);
      expect(baseMeta.mExtensionAsGroupToken.get(Extension2)).toBe(groupToken);
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

      const baseMeta = mock.normalize(Module1);
      expect(baseMeta.extensionProviders).toEqual([]);
      expect(baseMeta.exportedExtensionProviders).toEqual([Extension1]);
      expect(baseMeta.aExportedExtensionConfig).toHaveLength(1);
    });
  });

  describe('init hooks', () => {
    interface InitRawMeta extends BaseInitRawMeta<{ path?: string }> {
      flag?: boolean;
    }

    interface InitMeta extends BaseInitMeta {
      flag?: boolean;
      path?: string;
      modRefId?: ModRefId;
    }

    class InitHooks1 extends InitHooks<InitRawMeta> {
      override normalize(baseMeta: BaseMeta): InitMeta {
        if (isModuleWithParams(baseMeta.modRefId)) {
          const params = baseMeta.modRefId.initParams?.get(initSome);
          return { path: params?.path, modRefId: baseMeta.modRefId } as InitMeta;
        }

        return { flag: this.rawMeta.flag, modRefId: baseMeta.modRefId } as InitMeta;
      }
    }

    const initSome: InitDecorator<InitRawMeta, { path?: string }, InitMeta> = Reflector.makeClassDecorator(
      (data) => new InitHooks1(data),
    );

    it('adds init hooks to host module via allInitHooks and hostRawMeta', () => {
      @featureModule()
      class HostModule {}

      class HostInitHooks extends InitHooks<InitRawMeta> {
        override hostModule = HostModule;
        override hostRawMeta = { flag: true };

        override normalize(baseMeta: BaseMeta): InitMeta {
          return { flag: this.rawMeta.flag, modRefId: baseMeta.modRefId } as InitMeta;
        }
      }

      const hostInitSome: InitDecorator<InitRawMeta, {}, {}> = Reflector.makeClassDecorator(
        (data) => new HostInitHooks(data),
      );
      const allInitHooks = new Map([[hostInitSome, new HostInitHooks({})]]);

      const baseMeta = mock.normalize(HostModule, allInitHooks);
      expect(baseMeta.mInitHooks.has(hostInitSome)).toBe(true);
      expect(baseMeta.initMeta.get(hostInitSome)).toEqual({ flag: true, modRefId: HostModule });
    });

    it('imports hostModule when init decorator declares it', () => {
      @featureModule()
      class HostModule {}

      class HostInitHooks extends InitHooks<InitRawMeta> {
        override hostModule = HostModule;
      }

      const hostInitSome: InitDecorator<InitRawMeta, {}, {}> = Reflector.makeClassDecorator(
        (data) => new HostInitHooks(data),
      );

      class Service1 {}

      @hostInitSome({})
      @featureModule({ providersPerMod: [Service1], exports: [Service1] })
      class Module1 {}

      const baseMeta = mock.normalize(Module1);
      expect(baseMeta.importsModules).toContain(HostModule);
    });

    it('adds init hooks for imported module with params without init decorator on module class', () => {
      class Service1 {}

      @featureModule({ providersPerApp: [Service1] })
      class Module1 {}

      const moduleWithParams: ModuleWithParams = { module: Module1 };
      const allInitHooks = new Map([[initSome, new InitHooks1({})]]);

      @initSome({ imports: [{ mwp: moduleWithParams, path: 'prefix' }] })
      @rootModule()
      class AppModule {}

      mock.normalize(AppModule);

      const baseMeta = mock.normalize(moduleWithParams, allInitHooks);
      expect(baseMeta.initMeta.get(initSome)).toEqual({ path: 'prefix', modRefId: moduleWithParams });
    });
  });

  describe('checkAndMarkExternalModule()', () => {
    class ExternalModuleNormalizer extends ModuleNormalizer {
      customMeta = new Map<any, DecoratorAndValue[]>();

      override normalize(modRefId: any, allInitHooks = new Map()): BaseMeta {
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
      const rootMetaVal = new RootRawMetadata();
      const rootDec = new DecoratorAndValue(dummyDecorator, rootMetaVal, undefined, '/user-project/src');
      normalizer.customMeta.set(AppModule, [rootDec]);

      // External module outside /user-project/src
      const extMetaVal = Object.assign(new ModuleRawMetadata(), { providersPerApp: [{ token: 't', useValue: 1 }] });
      const extDec = new DecoratorAndValue(dummyDecorator, extMetaVal, undefined, '/node_modules/external-mod');
      normalizer.customMeta.set(ExternalModule, [extDec]);

      // Internal module inside /user-project/src
      const intMetaVal = Object.assign(new ModuleRawMetadata(), { providersPerApp: [{ token: 't', useValue: 1 }] });
      const intDec = new DecoratorAndValue(dummyDecorator, intMetaVal, undefined, '/user-project/src/features/internal-mod');
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

      const rootDec = new DecoratorAndValue(dummyDecorator, new RootRawMetadata(), undefined, '/user-project/src');
      normalizer.customMeta.set(AppModule, [rootDec]);

      const ditsmodMetaVal = Object.assign(new ModuleRawMetadata(), { providersPerApp: [{ token: 't', useValue: 1 }] });
      const ditsmodDec = new DecoratorAndValue(dummyDecorator, ditsmodMetaVal, undefined, '/user-project/node_modules/ditsmod/packages/core');
      normalizer.customMeta.set(DitsmodModule, [ditsmodDec]);

      normalizer.normalize(AppModule);
      const ditsmodMeta = normalizer.normalize(DitsmodModule);
      expect(ditsmodMeta.isExternal).toBe(true);
    });
  });
});

