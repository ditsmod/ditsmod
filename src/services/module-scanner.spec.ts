import { forwardRef } from '@ts-stack/di';
import 'reflect-metadata';

import { ModuleWithOptions, NormalizedModuleMetadata } from '../decorators/module';
import { RootModule } from '../decorators/root-module';
import { CanActivate } from '../decorators/route';
import { Extension } from '../types/types';
import { ModuleScanner } from './module-scanner';

describe('ModuleScanner', () => {
  class MockModuleScanner extends ModuleScanner {}

  let mock: MockModuleScanner;

  beforeEach(() => {
    mock = new MockModuleScanner();
  });

  describe('scanRootModule', () => {
    it('empty RootModule', () => {
      @RootModule()
      class AppModule {}

      const modMetadata = mock.scanRootModule(AppModule);
      const normalizedMetadata: NormalizedModuleMetadata = {
        providersPerApp: [],
        providersPerMod: [],
        providersPerReq: [],
        controllers: [],
        extensions: [],
        imports: [],
        exports: [],
        ngMetadataName: 'RootModule',
      };
      expect(modMetadata).toEqual(normalizedMetadata);
    });

    it('module without @RootModule decorator', () => {
      class AppModule {}
      expect(() => mock.scanRootModule(AppModule)).toThrowError(/does not have the "@RootModule\(\)" decorator/);
    });

    it('RootModule with some metadata', () => {
      class Module1 {}
      class Module2 {}
      class ModuleWithOptions1 {
        static witOptions(): ModuleWithOptions<ModuleWithOptions1> {
          return { module: ModuleWithOptions1 };
        }
      }
      class ProviderPerApp1 {}
      class ProviderPerApp2 {}
      class ProviderPerApp3 {}
      class ProviderPerReq1 {}
      class ProviderPerReq2 {}
      class Controller1 {}
      class Guard1 implements CanActivate {
        canActivate() {
          return true;
        }
      }
      class Extension1 implements Extension {
        init() {}
      }

      @RootModule({
        providersPerApp: [ProviderPerApp1, ProviderPerApp2, { provide: ProviderPerApp3, useClass: ProviderPerApp3 }],
        providersPerMod: [forwardRef(() => ProviderPerMod1)],
        providersPerReq: [ProviderPerReq1, ProviderPerReq2, forwardRef(() => ProviderPerReq3)],
        controllers: [Controller1],
        extensions: [Extension1],
        imports: [
          Module1,
          { guards: [Guard1, [Guard1, 'one', 'two']], module: Module2 },
          ModuleWithOptions1.witOptions(),
        ],
      })
      class AppModule {}

      class ProviderPerMod1 {}
      class ProviderPerReq3 {}

      const modMetadata = mock.scanRootModule(AppModule);
      const normalizedMetadata: NormalizedModuleMetadata = {
        providersPerApp: [ProviderPerApp1, ProviderPerApp2, { provide: ProviderPerApp3, useClass: ProviderPerApp3 }],
        providersPerMod: [ProviderPerMod1],
        providersPerReq: [ProviderPerReq1, ProviderPerReq2, ProviderPerReq3],
        controllers: [Controller1],
        extensions: [Extension1],
        imports: [
          { prefix: '', guards: [], module: Module1 },
          { prefix: '', guards: [{ guard: Guard1 }, { guard: Guard1, params: ['one', 'two'] }], module: Module2 },
          { prefix: '', guards: [], module: { module: ModuleWithOptions1 } },
        ],
        exports: [],
        ngMetadataName: 'RootModule',
      };

      expect(modMetadata).toEqual(normalizedMetadata);
    });
  });
});
