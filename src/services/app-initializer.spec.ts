import 'reflect-metadata';
import * as http from 'http';
import { Type } from '@ts-stack/di';
import { DefaultRouter } from '@ts-stack/router';

import { AppInitializer } from './app-initializer';
import { Logger } from '../types/logger';
import { Controller } from '../decorators/controller';
import { Router } from '../types/router';
import { Request } from './request';
import { defaultProvidersPerApp } from './default-providers-per-app';
import { ModuleType } from '../types/module-type';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { ModuleWithParams } from '../types/module-with-params';
import { Module } from '../decorators/module';
import { defaultProvidersPerReq } from './default-providers-per-req';
import { RootModule } from '../decorators/root-module';
import { NodeReqToken } from '../types/server-options';
import { ModuleMetadata } from '../types/module-metadata';
import { NormalizedRootModuleMetadata } from '../models/normalized-root-module-metadata';
import { ServiceProvider } from '../types/service-provider';

type MapId = string | number | ModuleType | ModuleWithParams;
type MapType = Map<MapId, NormalizedModuleMetadata>;

describe('AppInitializer', () => {
  (defaultProvidersPerApp as ServiceProvider[]).push({ provide: Router, useClass: DefaultRouter });

  class MockAppInitializer extends AppInitializer {
    opts = new NormalizedRootModuleMetadata();
    modulesMap: MapType;

    mergeMetadata(appModule: ModuleType): void {
      return super.mergeMetadata(appModule);
    }

    collectProvidersPerApp(mod: Type<any> | ModuleWithParams<any>) {
      return super.collectProvidersPerApp(mod);
    }

    prepareProvidersPerApp(appModule: ModuleType) {
      return super.prepareProvidersPerApp(appModule);
    }
  }

  class MyLogger extends Logger {
    debug = (...args: any[]): any => {
      console.log(`debug:\n ${'*'.repeat(50)}\n`, ...args);
    };
  }

  let mock: MockAppInitializer;

  beforeEach(async () => {
    mock = new MockAppInitializer();
  });

  describe('mergeMetadata()', () => {
    it('should set the default metatada', () => {
      @RootModule()
      class AppModule {}

      mock.mergeMetadata(AppModule);
      expect(mock.opts.httpModule).toBe(http);
      expect(mock.opts.serverName).toBe('Node.js');
      expect(mock.opts.serverOptions).toEqual({});
      expect(mock.opts.listenOptions).toBeDefined();
      expect(mock.opts.prefixPerApp).toBe('');
      expect(mock.opts.providersPerApp).toEqual([]);

      const opts = (mock.opts as unknown) as ModuleMetadata;
      expect(opts.controllers).toBe(undefined);
      expect(opts.exports).toBe(undefined);
      expect(opts.imports).toBe(undefined);
      expect(opts.providersPerMod).toBe(undefined);
      expect(opts.providersPerReq).toBe(undefined);
    });

    it('should merge default metatada with AppModule metadata', () => {
      class Controller1 {}
      class Provider1 {}
      class Module1 {}
      class Module2 {}

      const imports: ModuleWithParams[] = [
        { prefix: '', module: Module1 },
        { guards: [], module: Module2 },
      ];

      @RootModule({
        prefixPerApp: 'api',
        imports,
        controllers: [Controller1],
        providersPerApp: [Provider1],
      })
      class AppModule {}

      mock.mergeMetadata(AppModule);
      expect(mock.opts.httpModule).toBe(http);
      expect(mock.opts.serverName).toEqual('Node.js');
      expect(mock.opts.serverOptions).toEqual({});
      expect(mock.opts.prefixPerApp).toBe('api');
      expect(mock.opts.providersPerApp).toEqual([Provider1]);
      expect(mock.opts.listenOptions).toBeDefined();

      const opts = (mock.opts as unknown) as ModuleMetadata;
      expect(opts.controllers).toBe(undefined);
      expect(opts.exports).toBe(undefined);
      expect(opts.imports).toBe(undefined);
      expect(opts.providersPerMod).toBe(undefined);
      expect(opts.providersPerReq).toBe(undefined);
    });

    it('should throw error about absence @Module decorator', () => {
      class Module1 {}
      const msg = 'Module build failed: module "Module1" does not have the "@RootModule()" decorator';
      expect(() => mock.mergeMetadata(Module1)).toThrowError(msg);
    });
  });

  describe('prepareProvidersPerApp()', () => {
    it('should throw an error about non-identical duplicates in feature modules', () => {
      class Provider1 {}

      @Module({ providersPerApp: [{ provide: Provider1, useClass: Provider1 }] })
      class Module1 {}

      @Module({ providersPerApp: [Provider1] })
      class Module2 {}

      @RootModule({
        imports: [Module1, Module2],
      })
      class RootModule1 {}

      mock.mergeMetadata(RootModule1);
      const msg =
        'Exporting providers to RootModule1 was failed: found collision for: ' +
        'Provider1. You should manually add this provider to RootModule1.';
      expect(() => mock.prepareProvidersPerApp(RootModule1)).toThrow(msg);
    });

    it('should works with identical duplicates in feature modules', () => {
      class Provider1 {}

      @Module({ providersPerApp: [Provider1] })
      class Module1 {}

      @Module({ providersPerApp: [Provider1] })
      class Module2 {}

      @RootModule({
        imports: [Module1, Module2],
      })
      class RootModule1 {}

      mock.mergeMetadata(RootModule1);
      expect(() => mock.prepareProvidersPerApp(RootModule1)).not.toThrow();
    });

    it('should works with duplicates in providersPerApp of root module', () => {
      class Provider1 {}

      @RootModule({ providersPerApp: [Provider1, Provider1, { provide: Provider1, useClass: Provider1 }] })
      class RootModule2 {}

      mock.mergeMetadata(RootModule2);
      expect(() => mock.prepareProvidersPerApp(RootModule2)).not.toThrow();
      expect(mock.opts.providersPerApp.length).toBe(3);
    });

    it('should works with duplicates in root imports module', () => {
      class Provider1 {}
      const Alias = Provider1;
      const duplicates = [Provider1, Alias, { provide: Provider1, useClass: Provider1 }];

      @Module({ providersPerApp: duplicates })
      class Module1 {}

      @RootModule({
        imports: [Module1],
      })
      class RootModule1 {}

      mock.mergeMetadata(RootModule1);
      expect(() => mock.prepareProvidersPerApp(RootModule1)).not.toThrow();
    });

    it('should works with duplicates in feature module and root module', () => {
      class Provider1 {}
      const Alias = Provider1;
      const duplicates = [Provider1, Alias, { provide: Provider1, useClass: Provider1 }];

      @Module({ providersPerApp: duplicates })
      class Module1 {}

      @RootModule({
        imports: [Module1],
        providersPerApp: duplicates,
      })
      class RootModule3 {}

      mock.mergeMetadata(RootModule3);
      expect(() => mock.prepareProvidersPerApp(RootModule3)).not.toThrow();
      expect(mock.opts.providersPerApp.length).toBe(4);
    });

    it('should works with empty "imports" array in root module', () => {
      @RootModule({ imports: [] })
      class RootModule4 {}
      mock.mergeMetadata(RootModule4);
      expect(() => mock.prepareProvidersPerApp(RootModule4)).not.toThrow();
    });
  });

  describe('collectProvidersPerApp()', () => {
    class Provider0 {}
    class Provider1 {}
    class Provider2 {}
    class Provider3 {}
    class Provider4 {}
    class Provider5 {}
    class Provider6 {}
    class Provider7 {}

    @Module({
      providersPerApp: [Provider0],
    })
    class Module0 {}

    @Module({
      providersPerApp: [Provider1],
    })
    class Module1 {}

    @Module({
      providersPerApp: [Provider2, Provider3, Provider4],
      imports: [Module1],
    })
    class Module2 {}

    @Module({
      providersPerApp: [Provider5, Provider6],
      imports: [Module2],
    })
    class Module3 {}

    @RootModule({
      imports: [Module3],
      providersPerApp: [{ provide: Provider1, useClass: Provider7 }],
      exports: [Module0],
    })
    class AppModule {}

    it('should collects providers from exports array without imports them', () => {
      const providers = mock.collectProvidersPerApp(AppModule);
      expect(providers.includes(Provider0)).toBe(true);
    });

    it('should collects providers in particular order', () => {
      expect(mock.collectProvidersPerApp(AppModule)).toEqual([
        Provider1,
        Provider2,
        Provider3,
        Provider4,
        Provider5,
        Provider6,
        Provider0,
      ]);
    });

    it('should works with moduleWithOptions', () => {
      @Module({
        imports: [AppModule],
      })
      class Module6 {
        static withOptions(providers: ServiceProvider[]): ModuleWithParams<Module6> {
          return { module: Module6, providersPerApp: providers };
        }
      }
      const modWithOptions = Module6.withOptions([Provider7]);
      expect(mock.collectProvidersPerApp(modWithOptions)).toEqual([
        Provider1,
        Provider2,
        Provider3,
        Provider4,
        Provider5,
        Provider6,
        Provider0,
        Provider7,
      ]);
    });

    it('should have empty array of providersPerApp', () => {
      @Module()
      class Module7 {}
      expect(mock.collectProvidersPerApp(Module7)).toEqual([]);
    });
  });

  describe('export from root module', () => {
    class Provider0 {}
    class Provider1 {}
    class Provider2 {}
    class Provider3 {}
    class Provider4 {}
    class Provider5 {}
    class Provider6 {}
    class Provider7 {}
    class Provider8 {}
    class Provider9 {}

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
        { guards: [], module: Module4 },
      ],
      exports: [Module0, Module2.withOptions(), Module3],
      providersPerApp: [Logger],
    })
    class RootModule1 {}

    it('Module0', async () => {
      await mock.init(RootModule1);
      const mod0 = mock.modulesMap.get(Module0);
      expect(mod0.moduleMetadata.providersPerApp).toEqual([]);
      expect(mod0.moduleMetadata.providersPerMod).toEqual([Provider3, Provider4, Provider0]);
      expect(mod0.moduleMetadata.providersPerReq).toEqual([...defaultProvidersPerReq, Provider5, Provider6, Provider7]);
    });

    it('Module1', async () => {
      await mock.init(RootModule1);
      const mod1 = mock.modulesMap.get(Module1);
      expect(mod1.moduleMetadata.providersPerApp).toEqual([]);
      expect(mod1.moduleMetadata.providersPerMod).toEqual([Provider0, Provider3, Provider4, obj1, Provider2]);
      expect(mod1.moduleMetadata.providersPerReq).toEqual([...defaultProvidersPerReq, Provider5, Provider6, Provider7]);
    });

    it('Module2', async () => {
      await mock.init(RootModule1);
      const mod2 = mock.modulesMap.get(Module2);
      expect(mod2.moduleMetadata.providersPerApp).toEqual([]);
      expect(mod2.moduleMetadata.providersPerMod).toEqual([Provider0, Provider3, Provider4]);
      expect(mod2.moduleMetadata.providersPerReq).toEqual([...defaultProvidersPerReq, Provider5, Provider6, Provider7]);
    });

    it('Module3', async () => {
      await mock.init(RootModule1);
      const mod3 = mock.modulesMap.get(Module3);
      expect(mod3.moduleMetadata.providersPerApp).toEqual([]);
      expect(mod3.moduleMetadata.providersPerMod).toEqual([Provider0, Provider3, Provider4]);
      expect(mod3.moduleMetadata.providersPerReq).toEqual([...defaultProvidersPerReq, Provider5, Provider6, Provider7]);
    });

    it('Module4', async () => {
      await mock.init(RootModule1);
      const mod4 = mock.modulesMap.get(Module4);
      expect(mod4.moduleMetadata.providersPerApp).toEqual([]);
      expect(mod4.moduleMetadata.providersPerMod).toEqual([Provider0, Provider3, Provider4]);
      expect(mod4.moduleMetadata.providersPerReq).toEqual([
        ...defaultProvidersPerReq,
        Provider5,
        Provider6,
        Provider7,
        Provider8,
        Provider9,
      ]);
    });

    it('RootModule1', async () => {
      await mock.init(RootModule1);
      const root1 = mock.modulesMap.get(RootModule1);
      expect(root1.moduleMetadata.providersPerApp).toEqual([Logger]);
      expect(root1.moduleMetadata.providersPerMod).toEqual([Provider0, Provider1, Provider3, Provider4]);
      expect(root1.moduleMetadata.providersPerReq).toEqual([
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


  describe('Providers collisions', () => {
    describe('per a module', () => {
      class Provider1 {}
      class Provider2 {}
      class Provider3 {}
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

      it('exporting duplicates of Provider2', async () => {
        @RootModule({
          imports: [Module2],
        })
        class RootModule1 {}

        const msg =
          'Exporting providers to RootModule1 was failed: found collision for: ' +
          'Provider2. You should manually add this provider to RootModule1.';
        await expect(mock.init(RootModule1)).rejects.toThrow(msg);
      });

      it('mix exporting duplicates with "multi == true" per app and per mod', async () => {
        const ObjProviderPerApp: ServiceProvider = { provide: Provider1, useClass: Provider1, multi: true };
        const ObjProviderPerMod: ServiceProvider = { provide: Provider1, useClass: Provider1, multi: true };
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
          'Exporting providers to RootModule1 was failed: found collision for: ' +
          'Provider1. You should manually add this provider to RootModule1.';
        await expect(mock.init(RootModule1)).rejects.toThrow(msg);
      });

      it('exporting duplicates with "multi == true" not to throw', async () => {
        const ObjProvider: ServiceProvider = { provide: Provider1, useClass: Provider1, multi: true };
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

        await expect(mock.init(RootModule1)).resolves.not.toThrow();
      });

      it('exporting duplicates of Provider2, but declared in providersPerMod of root module', async () => {
        @RootModule({
          imports: [Module2],
          providersPerMod: [Provider2],
        })
        class RootModule1 {}

        await expect(mock.init(RootModule1)).resolves.not.toThrow();
      });

      it('exporting duplicates of Provider1 from Module1 and Module2', async () => {
        @RootModule({
          imports: [Module0, Module1.withOptions()],
        })
        class RootModule1 {}

        const msg =
          'Exporting providers to RootModule1 was failed: found collision for: ' +
          'Provider1. You should manually add this provider to RootModule1.';
        await expect(mock.init(RootModule1)).rejects.toThrow(msg);
      });

      it('exporting duplicates of Provider1 from Module1 and Module2, but declared in providersPerMod of root module', async () => {
        @RootModule({
          imports: [Module0, Module1.withOptions()],
          providersPerMod: [Provider1],
        })
        class RootModule1 {}

        await expect(mock.init(RootModule1)).resolves.not.toThrow();
      });
    });

    describe('per a req', () => {
      class Provider1 {}
      class Provider2 {}
      class Provider3 {}

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

      it('exporting duplicates of Provider2', async () => {
        @RootModule({
          imports: [Module2],
        })
        class RootModule1 {}

        const msg =
          'Exporting providers to RootModule1 was failed: found collision for: ' +
          'Provider2. You should manually add this provider to RootModule1.';
        await expect(mock.init(RootModule1)).rejects.toThrow(msg);
      });

      it('exporting duplicates of Provider2, but declared in providersPerReq of root module', async () => {
        @RootModule({
          imports: [Module2],
          providersPerReq: [Provider2],
        })
        class RootModule1 {}

        await expect(mock.init(RootModule1)).resolves.not.toThrow();
      });

      it('exporting duplicates of Provider1 from Module1 and Module2', async () => {
        @RootModule({
          imports: [Module0, Module1],
        })
        class RootModule1 {}

        const msg =
          'Exporting providers to RootModule1 was failed: found collision for: ' +
          'Provider1. You should manually add this provider to RootModule1.';
        await expect(mock.init(RootModule1)).rejects.toThrow(msg);
      });

      it('exporting duplicates of Provider1 from Module1 and Module2, but declared in providersPerReq of root module', async () => {
        @RootModule({
          imports: [Module0, Module1],
          providersPerReq: [Provider1],
        })
        class RootModule1 {}

        await expect(mock.init(RootModule1)).resolves.not.toThrow();
      });
    });

    describe('mix per app, per mod or per req', () => {
      class Provider0 {}
      class Provider1 {}
      class Provider2 {}
      class Provider3 {}

      it('case 1', async () => {
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
          'Exporting providers to RootModule1 was failed: found collision for: ' +
          'Provider0, Request, Provider1, InjectionToken NodeRequest. You should manually add these providers to RootModule1.';
        await expect(mock.init(RootModule1)).rejects.toThrow(msg);
      });

      it('case 2', async () => {
        @Module({
          exports: [Provider0, Provider1],
          providersPerMod: [Provider0, Provider1],
          providersPerApp: [{ provide: Router, useValue: '' }],
        })
        class Module0 {}

        @RootModule({
          imports: [Module0],
        })
        class RootModule1 {}

        const msg =
          'Exporting providers to RootModule1 was failed: found collision for: ' +
          'Router. You should manually add this provider to RootModule1.';
        await expect(mock.init(RootModule1)).rejects.toThrow(msg);
      });
    });
  });
});
