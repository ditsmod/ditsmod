import 'reflect-metadata';
import { ReflectiveInjector, Injectable, Type, Provider } from '@ts-stack/di';

import { ModuleFactory } from './module-factory';
import { NormalizedProvider } from './utils/ng-utils';
import {
  Module,
  ModuleMetadata,
  ModuleType,
  ModuleWithOptions,
  ProvidersMetadata,
  defaultProvidersPerReq,
} from './decorators/module';
import { Controller } from './decorators/controller';
import { Route } from './decorators/route';
import { Router } from './types/router';
import { defaultProvidersPerApp, RootModule } from './decorators/root-module';
import { Logger } from './types/logger';
import { AppFactory } from './app-factory';
import { NodeReqToken } from './types/injection-tokens';
import { Request } from './request';

describe('ModuleFactory', () => {
  @Injectable()
  class MockModuleFactory extends ModuleFactory {
    log: Logger;
    prefixPerApp: string;
    prefixPerMod: string;
    moduleName = 'MockModule';
    opts = new ModuleMetadata();
    router: Router;
    injectorPerMod: ReflectiveInjector;
    optsMap = new Map<Type<any>, ModuleMetadata>();
    allProvidersPerApp: Provider[];
    allExportedProvidersPerMod: Provider[] = [];
    allExportedProvidersPerReq: Provider[] = [];
    exportedProvidersPerMod: Provider[] = [];
    exportedProvidersPerReq: Provider[] = [];

    initProvidersPerReq() {
      return super.initProvidersPerReq();
    }

    quickCheckMetadata(moduleMetadata: ModuleMetadata) {
      return super.quickCheckMetadata(moduleMetadata);
    }

    normalizeMetadata(mod: ModuleType) {
      return super.normalizeMetadata(mod);
    }

    importProviders(isStarter: boolean, modOrObject: Type<any> | ModuleWithOptions<any>) {
      return super.importProviders(isStarter, modOrObject);
    }
  }

  class MockAppFactory extends AppFactory {
    prepareServerOptions(appModule: ModuleType) {
      return super.prepareServerOptions(appModule);
    }

    bootstrapModuleFactory(appModule: ModuleType) {
      return super.bootstrapModuleFactory(appModule);
    }
  }

  class MyLogger extends Logger {
    debug = (...args: any[]): any => {
      console.log(`debug:\n ${'*'.repeat(50)}\n`, ...args);
    };
  }

  const log = new MyLogger();

  let mock: MockModuleFactory;
  let mockApp: MockAppFactory;

  beforeEach(() => {
    mock = new MockModuleFactory(null, null, log);
    mockApp = new MockAppFactory();
  });

  describe('importGlobalProviders()', () => {
    it(`forbidden reexports providers`, () => {
      class Provider1 {}

      @Module({
        providersPerReq: [Provider1],
      })
      class Module1 {}

      @Module({
        imports: [Module1],
        exports: [Provider1],
      })
      class Module2 {}

      @RootModule({
        exports: [Module2],
      })
      class AppModule {}

      const metadata = new ModuleMetadata();
      const msg = /Exported Provider1 from Module2 should includes in/;
      expect(() => mock.importGlobalProviders(AppModule, metadata)).toThrow(msg);
    });

    it(`allow reexports module`, () => {
      class Provider1 {}

      @Module({
        providersPerReq: [Provider1],
        exports: [Provider1],
      })
      class Module1 {}

      @Module({
        imports: [Module1],
        exports: [Module1],
      })
      class Module2 {}

      @RootModule({
        exports: [Module2],
      })
      class AppModule {}

      const metadata = new ModuleMetadata();
      expect(() => mock.importGlobalProviders(AppModule, metadata)).not.toThrow();
      expect(mock.allExportedProvidersPerMod).toEqual([]);
      expect(mock.allExportedProvidersPerReq).toEqual([Provider1]);
    });

    it(`merge providers from reexported modules`, () => {
      class Provider1 {}
      class Provider2 {}

      @Module({
        providersPerReq: [Provider2],
        exports: [Provider2],
      })
      class Module1 {}

      @Module({
        providersPerMod: [Provider1],
        imports: [Module1],
        exports: [Provider1, Module1],
      })
      class Module2 {}

      @RootModule({
        exports: [Module2],
      })
      class AppModule {}

      const metadata = new ModuleMetadata();
      expect(() => mock.importGlobalProviders(AppModule, metadata)).not.toThrow();
      expect(mock.allExportedProvidersPerMod).toEqual([Provider1]);
      expect(mock.allExportedProvidersPerReq).toEqual([Provider2]);
    });

    it(`order exported providers`, () => {
      class Provider1 {}
      class Provider2 {}
      class Provider3 {}
      class Provider4 {}

      @Module({
        providersPerMod: [Provider1, Provider2],
        exports: [Provider1, Provider2],
      })
      class Module1 {}

      @Module({
        imports: [Module1],
        providersPerMod: [Provider3, Provider4],
        exports: [Module1, Provider3, Provider4],
      })
      class Module2 {}

      @RootModule({
        exports: [Module2],
      })
      class AppModule {}

      const metadata = new ModuleMetadata();
      expect(() => mock.importGlobalProviders(AppModule, metadata)).not.toThrow();
      expect(mock.allExportedProvidersPerMod).toEqual([Provider1, Provider2, Provider3, Provider4]);
      expect(mock.allExportedProvidersPerReq).toEqual([]);
    });

    it(`collision with exported providers`, () => {
      class Provider1 {}

      @Module({
        providersPerMod: [Provider1],
        exports: [{ provide: Provider1, useValue: 'one' }],
      })
      class Module1 {}

      @Module({
        imports: [Module1],
        providersPerMod: [Provider1],
        exports: [Module1, Provider1],
      })
      class Module2 {}

      @RootModule({
        exports: [Module2],
      })
      class AppModule {}

      const metadata = new ModuleMetadata();
      const msg = /Exporting providers in AppModule was failed: found collision for: Provider1/;
      expect(() => mock.importGlobalProviders(AppModule, metadata)).toThrow(msg);
    });

    fit(`collision with exported providers, but they are redeclared in root module`, () => {
      class Provider1 {}

      @Module({
        providersPerMod: [Provider1],
        exports: [{ provide: Provider1, useValue: 'one' }],
      })
      class Module1 {}

      @Module({
        imports: [Module1],
        providersPerMod: [Provider1],
        exports: [Module1, Provider1],
      })
      class Module2 {}

      @RootModule({
        exports: [Module2, { provide: Provider1, useValue: 'two' }],
        providersPerMod: [Provider1],
      })
      class AppModule {}

      const metadata = new ModuleMetadata();
      expect(() => mock.importGlobalProviders(AppModule, metadata)).not.toThrow();
      const providers = [{ provide: Provider1, useValue: 'one' }, Provider1, { provide: Provider1, useValue: 'two' }];
      expect(mock.allExportedProvidersPerMod).toEqual(providers);
    });

    it(`identical duplicates but not collision with exported providers`, () => {
      class Provider1 {}

      @Module({
        providersPerMod: [Provider1],
        exports: [{ provide: Provider1, useValue: 'one' }],
      })
      class Module1 {}

      @Module({
        imports: [Module1],
        providersPerMod: [Provider1],
        exports: [Module1, { provide: Provider1, useValue: 'one' }],
      })
      class Module2 {}

      @RootModule({
        exports: [Module2],
      })
      class AppModule {}

      const metadata = new ModuleMetadata();
      expect(() => mock.importGlobalProviders(AppModule, metadata)).not.toThrow();
    });
  });

  describe('mergeProviders()', () => {
    it(``, () => {});
  });

  describe('normalizeMetadata()', () => {
    it('should set default metatada', () => {
      @Module()
      class AppModule {}
      const metadata = mock.normalizeMetadata(AppModule);
      expect(metadata.controllers).toEqual([]);
      expect(metadata.exports).toEqual([]);
      expect(metadata.imports).toEqual([]);
      expect(metadata.providersPerMod).toEqual([]);
      expect(metadata.providersPerReq).toEqual([]);
      expect((metadata as any).ngMetadataName).toBe('Module');
    });

    it('should merge default metatada with AppModule metadata', () => {
      class Provider1 {}
      class Provider2 {}
      class Controller1 {}

      @Module({
        controllers: [Controller1],
        providersPerReq: [Provider1],
        providersPerMod: [Provider2],
      })
      class AppModule {}
      const metadata = mock.normalizeMetadata(AppModule);
      expect(metadata.controllers).toEqual([Controller1]);
      expect(metadata.exports).toEqual([]);
      expect(metadata.imports).toEqual([]);
      expect(metadata.providersPerMod).toEqual([Provider2]);
      expect(metadata.providersPerReq).toEqual([Provider1]);
    });

    it('Provider1 should not have metatada', () => {
      class Module1 {}
      const msg = `Module build failed: module "Module1" does not have the "@Module()" decorator`;
      expect(() => mock.normalizeMetadata(Module1)).toThrowError(msg);
    });
  });

  describe('quickCheckMetadata()', () => {
    it('should throw an error, when no export and no controllers', () => {
      class Provider1 {}
      class Provider2 {}

      @Module({
        providersPerMod: [Provider1, Provider2],
      })
      class Module1 {}

      const moduleMetadata = mock.normalizeMetadata(Module1);
      expect(() => mock.quickCheckMetadata(moduleMetadata)).toThrow(
        /Importing MockModule failed: this module should have/
      );
    });

    it('should throw an error, during imports module without export and without controllers', () => {
      class Provider1 {}
      class Provider2 {}

      @Module({
        providersPerMod: [Provider1, Provider2],
      })
      class Module1 {}

      @Module({
        imports: [Module1],
      })
      class Module2 {}

      const moduleMetadata = mock.normalizeMetadata(Module2);
      expect(() => mock.quickCheckMetadata(moduleMetadata)).toThrow(
        /Importing MockModule failed: this module should have/
      );
    });

    it('should not throw an error, when export some provider', () => {
      class Provider1 {}
      class Provider2 {}

      @Module({
        exports: [Provider1],
        providersPerMod: [Provider1, Provider2],
      })
      class Module1 {}

      const moduleMetadata = mock.normalizeMetadata(Module1);
      expect(() => mock.quickCheckMetadata(moduleMetadata)).not.toThrow();
    });

    it('should not throw an error, when declare some controller', () => {
      class Provider1 {}
      class Provider2 {}

      @Module({
        controllers: [Provider1],
        providersPerMod: [Provider1, Provider2],
      })
      class Module1 {}

      const moduleMetadata = mock.normalizeMetadata(Module1);
      expect(() => mock.quickCheckMetadata(moduleMetadata)).not.toThrow();
    });
  });

  describe('bootstrap()', () => {
    class Provider0 {}
    class Provider1 {}
    class Provider2 {}
    class Provider3 {}
    class Provider4 {}
    class Provider5 {}
    class Provider6 {}
    class Provider7 {}
    class Provider8 {}
    const overriddenProvider8 = { provide: Provider8, useValue: 'overridden' };
    class Provider9 {}

    describe(`exporting providers order`, () => {
      @Module({
        exports: [Provider0],
        providersPerMod: [Provider0],
      })
      class Module0 {}

      @Module({
        imports: [Module0],
        exports: [Module0, Provider1, Provider2, Provider3],
        providersPerMod: [Provider1, Provider2, Provider3],
      })
      class Module1 {}

      @Module({
        imports: [Module1],
        exports: [Module1, Provider5, Provider8],
        providersPerMod: [Provider4, Provider5, Provider6],
        providersPerReq: [Provider7, Provider8],
      })
      class Module2 {}

      @Controller()
      class Ctrl {
        @Route('GET')
        method() {}
      }

      @Module({
        imports: [Module2],
        exports: [Module2],
        providersPerReq: [Provider9, overriddenProvider8],
        controllers: [Ctrl],
      })
      class Module3 {}

      it(`case 1`, () => {
        const injectorPerApp = ReflectiveInjector.resolveAndCreate([
          ...defaultProvidersPerApp,
          { provide: Logger, useClass: MyLogger },
        ]);

        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        mock.bootstrap(new ProvidersMetadata(), 'api', '', Module3);
        expect(mock.prefixPerApp).toBe('api');

        const mod0 = mock.optsMap.get(Module0);
        expect(mod0.providersPerMod).toEqual([Provider0]);
        expect(mod0.providersPerReq).toEqual([]);
        expect((mod0 as any).ngMetadataName).toBe('Module');

        const mod1 = mock.optsMap.get(Module1);
        expect(mod1.providersPerMod).toEqual([Provider0, Provider1, Provider2, Provider3]);
        expect(mod1.providersPerReq).toEqual([]);
        expect((mod1 as any).ngMetadataName).toBe('Module');

        const mod2 = mock.optsMap.get(Module2);
        expect(mod2.providersPerMod).toEqual([
          Provider0,
          Provider1,
          Provider2,
          Provider3,
          Provider4,
          Provider5,
          Provider6,
        ]);
        expect(mod2.providersPerReq).toEqual([Provider7, Provider8]);
        expect((mod2 as any).ngMetadataName).toBe('Module');

        const mod3 = mock.optsMap.get(Module3);
        expect(mod3.providersPerMod).toEqual([Provider0, Provider1, Provider2, Provider3, Provider5]);
        expect(mod3.providersPerReq).toEqual([Ctrl, [], Provider8, Provider9, overriddenProvider8]);
        expect(mod3.controllers).toEqual([Ctrl]);
        expect((mod3 as any).ngMetadataName).toBe('Module');
      });

      @RootModule({
        imports: [Module3],
      })
      class Module4 {}

      it(`case 2`, () => {
        const injectorPerApp = ReflectiveInjector.resolveAndCreate(defaultProvidersPerApp as Provider[]);
        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        mock.bootstrap(new ProvidersMetadata(), 'some', 'other', Module4);

        expect(mock.prefixPerApp).toBe('some');
        expect(mock.prefixPerMod).toBe('other');
        expect(mock.router.find('GET', '/some/other').handle().controller).toBe(Ctrl);
        expect(mock.opts.providersPerMod).toEqual([Provider0, Provider1, Provider2, Provider3, Provider5]);
        expect(mock.opts.providersPerReq).toEqual([...defaultProvidersPerReq, Provider8]);
        expect((mock.opts as any).ngMetadataName).toBe('RootModule');
      });

      @Module({
        imports: [Module3],
      })
      class Module5 {}

      it(`should throw an error regarding the provider's absence`, () => {
        const injectorPerApp = ReflectiveInjector.resolveAndCreate(defaultProvidersPerApp as Provider[]);
        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        const errMsg = /Importing Module5 failed: this module should have/;
        expect(() => mock.bootstrap(new ProvidersMetadata(), 'api', '', Module5)).toThrow(errMsg);
      });

      @Module({
        exports: [Provider1, Provider2, Provider3],
        providersPerMod: [Provider1, Provider3],
      })
      class Module6 {}

      @RootModule({
        imports: [Module6],
      })
      class Module7 {}

      it(`should throw an error about not proper provider exports`, () => {
        const injectorPerApp = ReflectiveInjector.resolveAndCreate(defaultProvidersPerApp as Provider[]);
        mock = injectorPerApp.resolveAndInstantiate(MockModuleFactory) as MockModuleFactory;
        mock.injectorPerMod = injectorPerApp;
        const errMsg =
          `Exported Provider2 from Module6 ` +
          `should includes in "providersPerMod" or "providersPerReq", ` +
          `or in some "exports" of imported modules. ` +
          `Tip: "providersPerApp" no need exports, they are automatically exported.`;
        expect(() => mock.bootstrap(new ProvidersMetadata(), 'api', '', Module7)).toThrow(errMsg);
      });
    });

    describe(`Collisions`, () => {
      describe(`per a module`, () => {
        @Module({
          exports: [{ provide: Provider1, useValue: '' }],
          providersPerMod: [{ provide: Provider1, useClass: Provider1 }, Provider2],
        })
        class Module0 {}

        @Module({
          exports: [Provider1, { provide: Provider2, useFactory: () => {} }],
        })
        class Module1 {
          static withOptions() {
            return { module: Module1, providersPerMod: [Provider1, Provider2] };
          }
        }

        @Module({
          imports: [Module1.withOptions()],
          exports: [Module1.withOptions(), Provider2, Provider3],
          providersPerMod: [Provider2, Provider3],
        })
        class Module2 {}

        it(`exporting duplicates of Provider2`, () => {
          @RootModule({
            imports: [Module2],
          })
          class RootModule1 {}

          const msg =
            `Exporting providers in RootModule1 was failed: found collision for: ` +
            `Provider2. You should manually add this provider to RootModule1.`;
          expect(() => mockApp.prepareServerOptions(RootModule1)).toThrow(msg);
        });

        it(`mix exporting duplicates with "multi == true" per app and per mod`, () => {
          const ObjProviderPerApp: Provider = { provide: Provider1, useClass: Provider1, multi: true };
          const ObjProviderPerMod: Provider = { provide: Provider1, useClass: Provider1, multi: true };
          @Module({
            exports: [ObjProviderPerMod],
            providersPerMod: [ObjProviderPerMod, Provider2],
            providersPerApp: [ObjProviderPerApp],
          })
          class Module00 {}

          @Module({
            exports: [ObjProviderPerMod],
            providersPerMod: [ObjProviderPerMod],
          })
          class Module01 {}

          @RootModule({
            imports: [Module00, Module01],
          })
          class RootModule1 {}

          const msg =
            `Exporting providers in RootModule1 was failed: found collision for: ` +
            `Provider1. You should manually add this provider to RootModule1.`;
          expect(() => mockApp.prepareServerOptions(RootModule1)).toThrow(msg);
        });

        it(`exporting duplicates with "multi == true" not to throw`, () => {
          const ObjProvider: Provider = { provide: Provider1, useClass: Provider1, multi: true };
          @Module({
            exports: [ObjProvider],
            providersPerMod: [ObjProvider, Provider2],
          })
          class Module00 {}

          @Module({
            exports: [ObjProvider],
            providersPerMod: [ObjProvider],
          })
          class Module01 {}

          @RootModule({
            imports: [Module00, Module01],
          })
          class RootModule1 {}

          expect(() => mockApp.prepareServerOptions(RootModule1)).not.toThrow();
        });

        it(`exporting duplicates of Provider2, but declared in providersPerMod of root module`, () => {
          @RootModule({
            imports: [Module2],
            providersPerMod: [Provider2],
          })
          class RootModule1 {}

          expect(() => mockApp.prepareServerOptions(RootModule1)).not.toThrow();
        });

        it(`exporting duplicates of Provider1 from Module1 and Module2`, () => {
          @RootModule({
            imports: [Module0, Module1.withOptions()],
          })
          class RootModule1 {}

          const msg =
            `Exporting providers in RootModule1 was failed: found collision for: ` +
            `Provider1. You should manually add this provider to RootModule1.`;
          expect(() => mockApp.prepareServerOptions(RootModule1)).toThrow(msg);
        });

        it(`exporting duplicates of Provider1 from Module1 and Module2, but declared in providersPerMod of root module`, () => {
          @RootModule({
            imports: [Module0, Module1.withOptions()],
            providersPerMod: [Provider1],
          })
          class RootModule1 {}

          expect(() => mockApp.prepareServerOptions(RootModule1)).not.toThrow();
        });
      });

      describe(`per a req`, () => {
        @Module({
          exports: [{ provide: Provider1, useClass: Provider1 }],
          providersPerReq: [{ provide: Provider1, useClass: Provider1 }, Provider2],
        })
        class Module0 {}

        @Module({
          exports: [{ provide: Provider1, useExisting: Provider1 }, Provider2],
          providersPerReq: [Provider1, Provider2],
        })
        class Module1 {}

        @Module({
          imports: [Module1],
          exports: [Module1, { provide: Provider2, useClass: Provider2 }, Provider3],
          providersPerReq: [Provider2, Provider3],
        })
        class Module2 {}

        it(`exporting duplicates of Provider2`, () => {
          @RootModule({
            imports: [Module2],
          })
          class RootModule1 {}

          const msg =
            `Exporting providers in RootModule1 was failed: found collision for: ` +
            `Provider2. You should manually add this provider to RootModule1.`;
          expect(() => mockApp.prepareServerOptions(RootModule1)).toThrow(msg);
        });

        it(`exporting duplicates of Provider2, but declared in providersPerReq of root module`, () => {
          @RootModule({
            imports: [Module2],
            providersPerReq: [Provider2],
          })
          class RootModule1 {}

          expect(() => mockApp.prepareServerOptions(RootModule1)).not.toThrow();
        });

        it(`exporting duplicates of Provider1 from Module1 and Module2`, () => {
          @RootModule({
            imports: [Module0, Module1],
          })
          class RootModule1 {}

          const msg =
            `Exporting providers in RootModule1 was failed: found collision for: ` +
            `Provider1. You should manually add this provider to RootModule1.`;
          expect(() => mockApp.prepareServerOptions(RootModule1)).toThrow(msg);
        });

        it(`exporting duplicates of Provider1 from Module1 and Module2, but declared in providersPerReq of root module`, () => {
          @RootModule({
            imports: [Module0, Module1],
            providersPerReq: [Provider1],
          })
          class RootModule1 {}

          expect(() => mockApp.prepareServerOptions(RootModule1)).not.toThrow();
        });
      });

      describe(`mix per app, per mod or per req`, () => {
        it(`case 1`, () => {
          @Module({
            exports: [
              Provider0,
              Provider1,
              { provide: Request, useClass: Request },
              { provide: NodeReqToken, useValue: '' },
              Provider3,
            ],
            providersPerMod: [Provider0],
            providersPerReq: [
              { provide: Provider1, useClass: Provider1 },
              Provider2,
              { provide: NodeReqToken, useValue: '' },
              Provider3,
              Request,
            ],
          })
          class Module0 {}

          @RootModule({
            imports: [Module0],
            providersPerApp: [Provider0],
            providersPerMod: [Provider1],
            providersPerReq: [],
          })
          class RootModule1 {}

          const msg =
            `Exporting providers in RootModule1 was failed: found collision for: ` +
            `Provider0, Request, Provider1, InjectionToken NodeRequest. You should manually add these providers to RootModule1.`;
          expect(() => mockApp.prepareServerOptions(RootModule1)).toThrow(msg);
        });

        it(`case 2`, () => {
          @Module({
            exports: [Provider0, Provider1],
            providersPerApp: [Router],
          })
          class Module0 {}

          @RootModule({
            imports: [Module0],
          })
          class RootModule1 {}

          const msg =
            `Exporting providers in RootModule1 was failed: found collision for: ` +
            `Router. You should manually add this provider to RootModule1.`;
          expect(() => mockApp.prepareServerOptions(RootModule1)).toThrow(msg);
        });
      });
    });

    describe(`export from root module`, () => {
      @Controller()
      class Ctrl {}

      @Module({
        exports: [Provider0],
        providersPerMod: [Provider0],
      })
      class Module0 {}

      const obj1 = { provide: Provider1, useClass: Provider1 };
      @Module({
        controllers: [Ctrl],
        exports: [Provider1],
        providersPerMod: [obj1, Provider2],
      })
      class Module1 {}

      @Module({
        exports: [Provider3, Provider4],
      })
      class Module2 {
        static withOptions() {
          return { module: Module2, providersPerMod: [Provider3, Provider4] };
        }
      }

      @Module({
        exports: [Provider5, Provider6, Provider7],
        providersPerReq: [Provider5, Provider6, Provider7],
      })
      class Module3 {}

      @Module({
        exports: [Provider8, Provider9],
        providersPerReq: [Provider8, Provider9],
      })
      class Module4 {}

      @Module({
        providersPerApp: [{ provide: Logger, useClass: MyLogger }],
      })
      class Module5 {}

      @RootModule({
        imports: [
          Module0,
          Module1,
          Module2.withOptions(),
          Module5,
          { prefix: 'one', module: Module3 },
          { prefix: 'two', module: Module4 },
        ],
        exports: [Module0, Module2.withOptions(), Module3],
        providersPerApp: [Logger],
      })
      class RootModule1 {}

      it(`Module0`, () => {
        const { optsMap } = mockApp.prepareServerOptions(RootModule1);
        const mod0 = optsMap.get(Module0);
        expect(mod0.providersPerApp).toEqual([]);
        expect(mod0.providersPerMod).toEqual([Provider3, Provider4, Provider0]);
        expect(mod0.providersPerReq).toEqual([...defaultProvidersPerReq, Provider5, Provider6, Provider7]);
      });

      it(`Module1`, () => {
        const { optsMap } = mockApp.prepareServerOptions(RootModule1);
        const mod1 = optsMap.get(Module1);
        expect(mod1.providersPerApp).toEqual([]);
        expect(mod1.providersPerMod).toEqual([Provider0, Provider3, Provider4, obj1, Provider2]);
        expect(mod1.providersPerReq).toEqual([...defaultProvidersPerReq, Provider5, Provider6, Provider7]);
      });

      it(`Module2`, () => {
        const { optsMap } = mockApp.prepareServerOptions(RootModule1);
        const mod2 = optsMap.get(Module2);
        expect(mod2.providersPerApp).toEqual([]);
        expect(mod2.providersPerMod).toEqual([Provider0, Provider3, Provider4]);
        expect(mod2.providersPerReq).toEqual([...defaultProvidersPerReq, Provider5, Provider6, Provider7]);
      });

      it(`Module3`, () => {
        const { optsMap } = mockApp.prepareServerOptions(RootModule1);
        const mod3 = optsMap.get(Module3);
        expect(mod3.providersPerApp).toEqual([]);
        expect(mod3.providersPerMod).toEqual([Provider0, Provider3, Provider4]);
        expect(mod3.providersPerReq).toEqual([...defaultProvidersPerReq, Provider5, Provider6, Provider7]);
      });

      it(`Module4`, () => {
        const { optsMap } = mockApp.prepareServerOptions(RootModule1);
        const mod4 = optsMap.get(Module4);
        expect(mod4.providersPerApp).toEqual([]);
        expect(mod4.providersPerMod).toEqual([Provider0, Provider3, Provider4]);
        expect(mod4.providersPerReq).toEqual([
          ...defaultProvidersPerReq,
          Provider5,
          Provider6,
          Provider7,
          Provider8,
          Provider9,
        ]);
      });

      it(`RootModule1`, () => {
        const { optsMap } = mockApp.prepareServerOptions(RootModule1);
        const root1 = optsMap.get(RootModule1);
        expect(root1.providersPerApp).toEqual([Logger]);
        expect(root1.providersPerMod).toEqual([Provider0, Provider1, Provider3, Provider4]);
        expect(root1.providersPerReq).toEqual([
          ...defaultProvidersPerReq,
          Provider5,
          Provider6,
          Provider7,
          Provider8,
          Provider9,
        ]);
        // console.log(testOptionsMap);
      });
    });
  });
});
