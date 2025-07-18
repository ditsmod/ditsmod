import { featureModule, ParamsTransferObj } from '#decorators/feature-module.js';
import { InitHooksAndRawMeta } from '#decorators/init-hooks-and-metadata.js';
import { rootModule } from '#decorators/root-module.js';
import { injectable, makeClassDecorator, Provider } from '#di';
import { Extension } from '#extension/extension-types.js';
import { CallsiteUtils } from '#utils/callsites.js';
import { AnyObj, ModRefId } from '#types/mix.js';
import { ModuleWithParams } from '#types/module-metadata.js';
import { AddDecorator, NormalizedMeta } from '#types/normalized-meta.js';
import { clearDebugClassNames } from '#utils/get-debug-class-name.js';
import { ModuleNormalizer } from './module-normalizer.js';
import { Providers } from '#utils/providers.js';

describe('ModuleNormalizer', () => {
  let mock: ModuleNormalizer;

  beforeEach(() => {
    clearDebugClassNames();
    mock = new ModuleNormalizer();
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

    const result = mock.normalize({
      id: 'some-id',
      module: Module1,
      providersPerApp: [Service2],
      providersPerMod: [Service4],
      extensionsMeta: { two: 2 },
      exports: [Service4],
    });
    expect(result.providersPerApp).toEqual([Service1, Service2]);
    expect(result.providersPerMod).toEqual([Service3, Service4]);
    expect(result.exportedProvidersPerMod).toEqual([Service3, Service4]);
    expect(result.extensionsMeta).toEqual({ one: 1, two: 2 });
    expect(result.id).toEqual('some-id');
  });

  it('proprtly works imports/exports of modules', () => {
    @featureModule()
    class Module1 {}

    @featureModule()
    class Module2 {}

    @rootModule({
      imports: [Module1, Module2],
      exports: [Module2],
    })
    class Module3 {}

    const result = mock.normalize(Module3);
    expect(result.importsModules).toEqual([Module1, Module2]);
    expect(result.exportsModules).toEqual([Module2]);
  });

  it('exports multi providers', () => {
    class Multi {}

    @featureModule()
    class Module1 {}

    const meta = mock.normalize({
      module: Module1,
      providersPerMod: [{ token: Multi, useClass: Multi, multi: true }],
      exports: [Multi],
    });
    expect(meta.exportedProvidersPerMod.length).toBe(0);
    expect(meta.exportedMultiProvidersPerMod).toEqual<Provider[]>([{ token: Multi, useClass: Multi, multi: true }]);
  });

  it('import module via static metadata, but export via module params', () => {
    class Service1 {}
    class Service2 {}

    @featureModule({ providersPerMod: [Service1] })
    class Module1 {}

    const moduleWithParams: ModuleWithParams = { module: Module1, exports: [Service1] };
    @featureModule({ imports: [moduleWithParams], providersPerMod: [Service2] })
    class Module2 {}

    const result = mock.normalize({ module: Module2, exports: [moduleWithParams] });
    expect(result.importsWithParams).toEqual([moduleWithParams]);
    expect(result.exportsWithParams).toEqual([moduleWithParams]);
    expect(result.providersPerMod).toEqual([Service2]);
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

    expect(() => mock.normalize(Module2)).toThrow(/includes in "providersPerApp" and "exports" of/);
  });

  it('module exported normalized provider', () => {
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

  it('module exported invalid extension', () => {
    @injectable()
    class Extension1 {}

    @featureModule({ extensions: [{ extension: Extension1, export: true }] })
    class Module2 {}

    const msg =
      'Exporting "Extension1" from "Module2" failed: all extensions must have stage1(), stage2() or stage3() method';
    expect(() => mock.normalize(Module2)).toThrow(msg);
  });

  it('module exported valid extension', () => {
    @injectable()
    class Extension1 implements Extension {
      async stage1() {}
    }

    @featureModule({ extensions: [{ extension: Extension1, export: true }] })
    class Module2 {}

    expect(() => mock.normalize(Module2)).not.toThrow();
    const meta = mock.normalize(Module2);
    expect(meta.extensionsProviders).toEqual([Extension1]);
    expect(meta.exportedExtensionsProviders).toEqual([Extension1]);
  });

  describe('creating custom decorator with init hook', () => {
    interface ReturnsType extends ParamsTransferObj {
      baseMeta: NormalizedMeta;
      rawMeta: ArgumentsType;
    }

    class InitHooksAndRawMeta1 extends InitHooksAndRawMeta<ArgumentsType> {
      override normalize(baseMeta: NormalizedMeta): ReturnsType {
        return { baseMeta, rawMeta: this.rawMeta };
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
      importsWithParams?: { modRefId: ModRefId; path?: string; guards?: any[] }[];
    }

    const initSome: AddDecorator<ArgumentsType, ReturnsType> = makeClassDecorator(getInitHooksAndRawMeta);

    it('initHooks.normalize() correctly works', () => {
      const rawMeta: ArgumentsType = { one: 1, two: 2 };

      @initSome(rawMeta)
      @featureModule()
      class Module1 {}

      const result = mock.normalize(Module1).normDecorMeta.get(initSome);
      expect(result?.baseMeta.modRefId).toBe(Module1);
      expect(result?.rawMeta).toEqual(rawMeta);
    });

    it('importsWithParams must have shallow copy of the params, and new modRefId', () => {
      class Module1 {}
      class Module2 {}
      class Service1 {}
      const modRefId: ModuleWithParams = { module: Module1, providersPerApp: [Service1] };
      const expectedImportsWithParams = [{ modRefId }, { modRefId: Module2 }, { modRefId, path: '' }];

      @initSome({ importsWithParams: expectedImportsWithParams })
      @featureModule()
      class Module3 {}

      const result = mock.normalize(Module3).normDecorMeta.get(initSome);
      const actualImportsWithParams = result?.rawMeta.importsWithParams;
      expect(actualImportsWithParams?.at(0)).toEqual(expectedImportsWithParams?.at(0)); // Shallow copy of params
      expect(actualImportsWithParams?.at(0)).not.toBe(expectedImportsWithParams?.at(0)); // Not hard copy of params
      const newModRefId1 = actualImportsWithParams?.at(0)?.modRefId as ModuleWithParams;
      const newModRefId2 = actualImportsWithParams?.at(1)?.modRefId as ModuleWithParams;
      const newModRefId3 = actualImportsWithParams?.at(2)?.modRefId as ModuleWithParams;
      expect(newModRefId1).toEqual(modRefId); // Shallow copy of ModuleWithParams
      expect(newModRefId1.module).toBe(modRefId.module);
      expect(newModRefId1).not.toBe(modRefId); // Not hard copy of ModuleWithParams
      expect(newModRefId1).not.toBe(newModRefId2);
      expect(newModRefId1).toBe(newModRefId3);

      // In the second element, `{ modRefId: Module 2 }` has been replaced with `{ modIfIed: { module: Module 2 } }`.
      expect(actualImportsWithParams?.at(1)).toEqual({ modRefId: { module: Module2 } });
    });
  });
});
