import { featureModule } from '#decorators/feature-module.js';
import { BaseInitRawMeta, InitHooks } from '#decorators/init-hooks-and-metadata.js';
import { BaseInitMeta } from '#types/base-meta.js';
import { rootModule } from '#decorators/root-module.js';
import { forwardRef, injectable, makeClassDecorator, MultiProvider } from '#di';
import { Extension } from '#extension/extension-types.js';
import { CallsiteUtils } from '#utils/callsites.js';
import { AnyObj, ModRefId } from '#types/mix.js';
import { FeatureModuleParams, ModuleWithInitParams, ModuleWithParams } from '#types/module-metadata.js';
import { BaseMeta } from '#types/base-meta.js';
import { InitDecorator } from '#decorators/init-hooks-and-metadata.js';
import { clearDebugClassNames } from '#utils/get-debug-class-name.js';
import { ModuleNormalizer } from './module-normalizer.js';
import { Providers } from '#utils/providers.js';
import {
  ExportingUnknownSymbol,
  ForbiddenExportNormalizedProvider,
  ForbiddenExportProvidersPerApp,
  InvalidExtension,
  ReexportFailed,
} from '#error/core-errors.js';

describe('ModuleNormalizer', () => {
  class MockModuleNormalizer extends ModuleNormalizer {
    override normalize(modRefId: ModRefId): BaseMeta {
      return super.normalize(modRefId, new Map());
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
    expectedMeta.modRefId = AppModule;
    expectedMeta.decorator = rootModule;
    expectedMeta.declaredInDir = CallsiteUtils.getCallerDir('transformModule');
    expectedMeta.isExternal = false;
    expectedMeta.mInitHooks = expect.any(Map);

    expect(mock.normalize(AppModule)).toEqual(expectedMeta);
  });

  it('rawMeta -> baseMeta: transformation of raw metadata into normalized metadata', () => {
    class Service1 {}
    class Service2 {}
    class Service3 {}
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
    const multiProvider: MultiProvider = { token: Service3, useValue: 'some-value', multi: true };

    @rootModule({
      imports: [Module1, moduleWithParams],
      providersPerApp: new Providers().passThrough(Service1),
      providersPerMod: [Service2, multiProvider],
      resolvedCollisionsPerApp: [[Service1, Module1]],
      resolvedCollisionsPerMod: [[Service2, Module2]],
      extensions: [{ extension: Extension1, export: true }],
      extensionsMeta: { one: 1 },
      exports: [Service2, Service3, Module1],
    })
    class AppModule {}

    const baseMeta = mock.normalize(AppModule);
    expect(baseMeta.decorator).toBe(rootModule);
    expect(baseMeta.declaredInDir).toEqual(expect.any(String));
    expect(baseMeta.importsModules).toEqual([Module1]);
    expect(baseMeta.exportsModules).toEqual([Module1]);
    expect(baseMeta.importsWithParams).toEqual([moduleWithParams]);
    expect(baseMeta.providersPerApp).toEqual([Service1]);
    expect(baseMeta.providersPerMod).toEqual([Service2, multiProvider]);
    expect(baseMeta.exportedProvidersPerMod).toEqual([Service2]);
    expect(baseMeta.exportedMultiProvidersPerMod).toEqual([multiProvider]);
    expect(baseMeta.resolvedCollisionsPerApp).toEqual([[Service1, Module1]]);
    expect(baseMeta.resolvedCollisionsPerMod).toEqual([[Service2, Module2]]);
    expect(baseMeta.extensionsProviders).toEqual([Extension1]);
    expect(baseMeta.exportedExtensionsProviders).toEqual([Extension1]);
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
      resolvedCollisionsPerMod: [[forwardRef(() => Service2), forwardRef(() => Module1)]],
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
    expect(baseMeta.resolvedCollisionsPerMod).toEqual([[Service2, Module1]]);
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
    expect(baseMeta.extensionsProviders).toEqual([Extension1]);
    expect(baseMeta.exportedExtensionsProviders).toEqual([Extension1]);
  });

  describe('creating custom decorator with init hooks', () => {
    interface InitMeta extends BaseInitMeta {
      baseMeta: BaseMeta;
      rawMeta: RawMeta;
    }

    class InitHooks1 extends InitHooks<RawMeta> {
      override normalize(baseMeta: BaseMeta) {
        return {
          baseMeta,
          rawMeta: this.rawMeta,
        } as InitMeta;
      }
    }

    function getInitHooks(data?: RawMeta): InitHooks<RawMeta> {
      const metadata = Object.assign({}, data);
      return new InitHooks1(metadata);
    }

    interface InitParams extends FeatureModuleParams {
      path?: string;
      num?: number;
    }

    interface RawMeta extends BaseInitRawMeta<InitParams> {
      one?: number;
      two?: number;
      appends?: ({ module: ModRefId } & AnyObj)[];
    }

    const initSome: InitDecorator<RawMeta, InitParams, InitMeta> = makeClassDecorator(getInitHooks);

    it('during import MWP, merge existing init params with new init params', () => {
      class Service1 {}
      class Service2 {}
      class Service3 {}

      @featureModule()
      class Module1 {}

      @featureModule()
      class Module2 {}

      const mwp: ModuleWithInitParams & InitParams = {
        module: Module1,
        providersPerMod: [Service1],
        providersPerApp: [Service3],
        extensionsMeta: { one: 1 },
        num: 4,
        initParams: new Map(),
      };
      mwp.initParams.set(initSome, { path: 'path-1' });

      const mwp1: ModuleWithInitParams & InitParams = {
        module: Module2,
        providersPerApp: [Service2],
        num: 12,
        extensionsMeta: { four: 4 },
        initParams: new Map(),
      };
      mwp1.initParams.set(initSome, {
        path: 'path-2',
        providersPerApp: [Service1],
        num: 11,
        extensionsMeta: { three: 3 },
      });

      @initSome({
        imports: [{ mwp: mwp, providersPerMod: [Service2], extensionsMeta: { two: 2 }, num: 5 }, mwp1],
      })
      @featureModule()
      class AppModule {}

      mock.normalize(AppModule);
      expect(mwp.initParams?.get(initSome)).toEqual({
        path: 'path-1',
        providersPerMod: [Service1, Service2],
        extensionsMeta: { one: 1, two: 2 },
        num: 5,
        providersPerApp: [Service3],
      });
      expect(mwp1.initParams?.get(initSome)).toEqual({
        providersPerApp: [Service1, Service2],
        num: 12,
        extensionsMeta: { three: 3, four: 4 },
        path: 'path-2',
      });
    });

    it('initHooks.normalize() correctly works', () => {
      const rawMeta: RawMeta = { one: 1, two: 2 };

      @initSome(rawMeta)
      @featureModule()
      class Module1 {}

      const baseMeta = mock.normalize(Module1).initMeta.get(initSome);
      expect(baseMeta?.baseMeta.modRefId).toBe(Module1);
      expect(baseMeta?.rawMeta).toEqual(rawMeta);
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
});
