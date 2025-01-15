import { beforeEach, describe, expect, it, vi } from 'vitest';

import { featureModule, RawMeta } from '#decorators/module.js';
import { rootModule } from '#decorators/root-module.js';
import { InjectionToken, injectable, forwardRef, Provider } from '#di';
import { Extension } from '#extension/extension-types.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { CallsiteUtils } from '#utils/callsites.js';
import { ModuleManager } from './module-manager.js';
import { ModuleType, AnyObj } from '#types/mix.js';
import { ModuleWithParams } from '#types/module-metadata.js';
import { NormalizedModuleMetadata } from '#types/normalized-module-metadata.js';
import { clearDebugClassNames } from '#utils/get-debug-class-name.js';
import { ModuleNormalizer } from './module-normalizer.js';
import { inspect } from 'node:util';

describe('ModuleNormalizer', () => {
  type ModuleId = string | ModuleType | ModuleWithParams;
  @injectable()
  class Provider0 {}
  @injectable()
  class Provider1 {}
  @injectable()
  class Provider2 {}
  @injectable()
  class Provider3 {}

  class MockModuleNormalizer extends ModuleNormalizer {}

  let mock: MockModuleNormalizer;

  beforeEach(() => {
    clearDebugClassNames();
  });

  it('empty root module', () => {
    @rootModule()
    class AppModule {}

    const expectedMeta = new NormalizedModuleMetadata();
    expectedMeta.id = '';
    expectedMeta.name = 'AppModule';
    expectedMeta.modRefId = AppModule;
    expectedMeta.decorator = rootModule;
    expectedMeta.declaredInDir = CallsiteUtils.getCallerDir();
    expectedMeta.isExternal = false;
    expectedMeta.rawMeta = expect.any(Object);

    expect(new ModuleNormalizer().normalize(AppModule)).toEqual(expectedMeta);
  });

  it('module reexports another a module without @featureModule decorator', () => {
    class Module1 {}

    @featureModule({ imports: [Module1], exports: [Module1] })
    class Module2 {}

    expect(() => new ModuleNormalizer().normalize(Module2)).toThrow('if "Module1" is a provider, it must be included in');
  });

  it('imports module with params, but exports only a module class (without ref to module with params)', () => {
    @featureModule({ providersPerMod: [Provider1], exports: [Provider1] })
    class Module1 {}
    const moduleWithParams: ModuleWithParams = { module: Module1 };

    @featureModule({
      imports: [moduleWithParams],
      exports: [Module1],
    })
    class Module2 {}

    const msg = 'Reexport from Module2 failed: Module1 includes in exports, but not includes in imports';
    expect(() => new ModuleNormalizer().normalize(Module2)).toThrow(msg);
  });

  it('module exported provider from providersPerApp', () => {
    @featureModule({ providersPerApp: [Provider1], exports: [Provider1] })
    class Module2 {}

    expect(() => new ModuleNormalizer().normalize(Module2)).toThrow(/includes in "providersPerApp" and "exports" of/);
  });

  it('module exported normalized provider', () => {
    @featureModule({ providersPerMod: [Provider1], exports: [{ token: Provider1, useClass: Provider1 }] })
    class Module2 {}

    expect(() => new ModuleNormalizer().normalize(Module2)).toThrow('failed: in "exports" array must be includes tokens only');
  });

  it('exports module without imports it', () => {
    @featureModule({ providersPerMod: [Provider1], exports: [Provider1] })
    class Module1 {}

    @featureModule({ exports: [Module1] })
    class Module2 {}

    expect(() => new ModuleNormalizer().normalize(Module2)).toThrow(/Reexport from Module2 failed: Module1 includes in exports/);
  });

  it('module exported invalid extension', () => {
    @injectable()
    class Extension1 {}

    @featureModule({ extensions: [{ extension: Extension1 as any, export: true }] })
    class Module2 {}

    expect(() => new ModuleNormalizer().normalize(Module2)).toThrow('must have stage1(), stage2() or stage3() method');
  });

  it('module exported invalid extension', () => {
    @injectable()
    class Extension1 {}

    @featureModule({ extensions: [{ extension: Extension1 as any, export: true }] })
    class Module2 {}

    const msg = 'Exporting "Extension1" from "Module2" failed: all extensions must have stage1';
    expect(() => new ModuleNormalizer().normalize(Module2)).toThrow(msg);
  });

  it('module exported valid extension', () => {
    @injectable()
    class Extension1 implements Extension {
      async stage1() {}
    }

    @featureModule({ extensions: [{ extension: Extension1 as any, export: true }] })
    class Module2 {}

    expect(() => new ModuleNormalizer().normalize(Module2)).not.toThrow();
    const meta = new ModuleNormalizer().normalize(Module2);
    expect(meta.extensionsProviders).toEqual([Extension1]);
    expect(meta.exportedExtensionsProviders).toEqual([Extension1]);
  });
});
