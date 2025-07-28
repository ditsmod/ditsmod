import { featureModule } from '#decorators/feature-module.js';
import { InitImportExport } from '#decorators/init-hooks-and-metadata.js';
import { InitHooksAndRawMeta } from '#decorators/init-hooks-and-metadata.js';
import { rootModule } from '#decorators/root-module.js';
import { forwardRef, injectable, makeClassDecorator, MultiProvider, Provider } from '#di';
import { Extension } from '#extension/extension-types.js';
import { CallsiteUtils } from '#utils/callsites.js';
import { AnyObj, ModRefId } from '#types/mix.js';
import { ModuleWithParams, ModuleWithSrcInitMeta } from '#types/module-metadata.js';
import { AddDecorator, NormalizedMeta } from '#types/normalized-meta.js';
import { clearDebugClassNames } from '#utils/get-debug-class-name.js';
import { ModuleNormalizer } from './module-normalizer.js';
import { Providers } from '#utils/providers.js';

describe('ModuleNormalizer', () => {
  class MockModuleNormalizer extends ModuleNormalizer {
    override normalize(modRefId: ModRefId): NormalizedMeta<AnyObj, AnyObj> {
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

    const expectedMeta = new NormalizedMeta();
    expectedMeta.id = '';
    expectedMeta.name = 'AppModule';
    expectedMeta.modRefId = AppModule;
    expectedMeta.decorator = rootModule;
    expectedMeta.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta.isExternal = false;
    expectedMeta.mInitHooksAndRawMeta = expect.any(Map);

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

    const msg = 'if "Module1" is a provider, it must be included in';
    expect(() => mock.normalize(Module2)).toThrow(msg);
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

    const msg = 'Reexport from Module2 failed: Module1 includes in exports, but not includes in imports';
    expect(() => mock.normalize(Module2)).toThrow(msg);
  });

  it('module exported provider from providersPerApp', () => {
    class Service1 {}
    @featureModule({ providersPerApp: [Service1], exports: [Service1] })
    class Module2 {}

    expect(() => mock.normalize(Module2)).toThrow('includes in "providersPerApp" and "exports" of');
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

    const msg = 'failed: in "exports" array must be includes tokens only';
    expect(() => mock.normalize(Module2)).toThrow(msg);
  });

  it('exports module without imports it', () => {
    class Service1 {}
    @featureModule({ providersPerMod: [Service1], exports: [Service1] })
    class Module1 {}

    @featureModule({ exports: [Module1] })
    class Module2 {}

    const msg = 'Reexport from Module2 failed: Module1 includes in exports';
    expect(() => mock.normalize(Module2)).toThrow(msg);
  });

  it('module exports an invalid extension', () => {
    @injectable()
    class Extension1 {}

    @featureModule({ extensions: [{ extension: Extension1, export: true }] })
    class Module2 {}

    const msg =
      'Exporting "Extension1" from "Module2" failed: all extensions must have stage1(), stage2() or stage3() method';
    expect(() => mock.normalize(Module2)).toThrow(msg);
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
    interface ReturnsType extends InitImportExport {
      baseMeta: NormalizedMeta;
      rawMeta: ArgumentsType;
    }

    class InitHooksAndRawMeta1 extends InitHooksAndRawMeta<ArgumentsType> {
      override normalize(baseMeta: NormalizedMeta): ReturnsType {
        return {
          baseMeta,
          rawMeta: this.rawMeta,
          importsModules: this.importExport?.importsModules,
          importsWithParams: this.importExport?.importsWithParams,
          importsWithModRefId: this.importExport?.importsWithModRefId,
          exportsModules: this.importExport?.exportsModules,
          exportsWithParams: this.importExport?.exportsWithParams,
          exportsWithModRefId: this.importExport?.exportsWithModRefId,
        };
      }
    }

    function getInitHooksAndRawMeta(data?: ArgumentsType): InitHooksAndRawMeta<ArgumentsType> {
      const metadata = Object.assign({}, data);
      return new InitHooksAndRawMeta1(metadata);
    }

    interface ArgumentsType {
      one?: number;
      two?: number;
      appends?: ({ module: ModRefId } & AnyObj)[];
      imports?: (ModRefId | { modRefId: ModRefId; path?: string; guards?: any[] })[];
      exports?: any[];
    }

    const initSome: AddDecorator<ArgumentsType, ReturnsType> = makeClassDecorator(getInitHooksAndRawMeta);

    it('initHooks.normalize() correctly works', () => {
      const rawMeta: ArgumentsType = { one: 1, two: 2 };

      @initSome(rawMeta)
      @featureModule()
      class Module1 {}

      const baseMeta = mock.normalize(Module1).initMeta.get(initSome);
      expect(baseMeta?.baseMeta.modRefId).toBe(Module1);
      expect(baseMeta?.rawMeta).toEqual(rawMeta);
    });

    it('init hooks need srcInitMeta property in moduleWithParams', () => {
      class Module1 {}
      class Module2 {}
      class Service1 {}
      const modRefId: ModuleWithParams & AnyObj = {
        module: Module1,
        providersPerApp: [Service1],
        srcInitMeta: expect.any(Map),
      };
      const expectedImportsWithParams = [{ modRefId }, { modRefId: Module2 }];

      @initSome({ imports: expectedImportsWithParams })
      @featureModule()
      class Module3 {}

      const baseMeta = mock.normalize(Module3).initMeta.get(initSome);
      const actualImportsWithParams = baseMeta?.rawMeta.imports;
      expect(actualImportsWithParams?.at(0)).toBe(expectedImportsWithParams?.at(0));

      // In the second element, `{ modRefId: Module 2 }` has been replaced with `{ modIfIed: { module: Module 2 } }`.
      expect(actualImportsWithParams?.at(1)).toEqual({
        modRefId: { module: Module2, srcInitMeta: expect.any(Map) },
      });
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
        imports: [Module1, moduleWithParams2, { modRefId: Module3 }, { modRefId: moduleWithParams4 }],
        exports: [Module1, moduleWithParams2, moduleWithParams4],
      })
      @rootModule()
      class AppModule {}

      const baseMeta = mock.normalize(AppModule);
      expect(baseMeta.importsModules).toEqual([Module1]);
      expect(baseMeta.exportsModules).toEqual([Module1]);
      expect(baseMeta.importsWithParams).toEqual([
        moduleWithParams2,
        { module: Module3, srcInitMeta: expect.any(Map) } as ModuleWithSrcInitMeta,
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
          { modRefId: forwardRef(() => Module3) },
          { modRefId: moduleWithParams4 },
        ],
        exports: [forwardRef(() => Module1), moduleWithParams2, moduleWithParams4],
      })
      @rootModule()
      class AppModule {}

      const baseMeta = mock.normalize(AppModule);
      expect(baseMeta.importsModules).toEqual([Module1]);
      expect(baseMeta.importsWithParams).toEqual([
        moduleWithParams2,
        { module: Module3, srcInitMeta: expect.any(Map) } as ModuleWithSrcInitMeta,
        moduleWithParams4,
      ]);
      expect(baseMeta.exportsModules).toEqual([Module1]);
      expect(baseMeta.exportsWithParams).toEqual([moduleWithParams2, moduleWithParams4]);
      expect(moduleWithParams2.module).toBe(Module2);
      expect(moduleWithParams4.module).toBe(Module4);
      const initMeta = baseMeta.initMeta.get(initSome)!;
      expect(initMeta.exportsModules).toEqual([Module1]);
      expect(initMeta.exportsWithParams).toEqual([moduleWithParams2, moduleWithParams4]);
    });
  });
});
