import { ReflectiveInjector } from '@ts-stack/di';
import 'reflect-metadata';

import { Controller } from '../decorators/controller';
import { Module } from '../decorators/module';
import { RootModule } from '../decorators/root-module';
import { RootMetadata } from '../models/root-metadata';
import { ExtensionMetadata } from '../types/extension-metadata';
import { Logger, LoggerConfig } from '../types/logger';
import { ModuleType } from '../types/module-type';
import { ModuleWithParams } from '../types/module-with-params';
import { DefaultLogger } from './default-logger';
import { defaultProvidersPerApp } from './default-providers-per-app';
import { defaultProvidersPerReq } from './default-providers-per-req';
import { ModInitializer } from './mod-initializer';
import { ModuleManager } from './module-manager';

describe('ModInitializer', () => {
  class MockModInitializer extends ModInitializer {
    extensionsMetadataMap: Map<ModuleType | ModuleWithParams, ExtensionMetadata>;
  }

  class MyLogger extends Logger {}

  let mock: MockModInitializer;
  let moduleManager: ModuleManager;

  beforeEach(async () => {
    const config = new LoggerConfig();
    const log = new DefaultLogger(config);
    moduleManager = new ModuleManager(log);
    const injectorPerApp = ReflectiveInjector.resolveAndCreate([
      ...defaultProvidersPerApp,
      { provide: Logger, useClass: MyLogger },
      { provide: ModuleManager, useValue: moduleManager },
      RootMetadata,
      MockModInitializer
    ]);
    mock = injectorPerApp.get(MockModInitializer);
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
      providersPerMod: [Provider3, Provider4],
    })
    class Module2 {
      static withParams() {
        return { module: Module2 };
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

    const module2WithParams: ModuleWithParams = Module2.withParams();
    const module3WithParams: ModuleWithParams = { prefix: 'one', module: Module3 };
    const module4WithParams: ModuleWithParams = { guards: [], module: Module4 };
    @RootModule({
      serverName: 'custom-server',
      imports: [Module0, Module1, module2WithParams, Module5, module3WithParams, module4WithParams],
      exports: [Module0, Module2, Module3],
      providersPerApp: [Logger],
    })
    class AppModule {}

    it('Module0', async () => {
      moduleManager.scanRootModule(AppModule);
      await mock.init();
      const mod0 = mock.extensionsMetadataMap.get(Module0);
      expect(mod0.moduleMetadata.providersPerApp).toEqual([]);
      expect(mod0.moduleMetadata.providersPerMod).toEqual([Provider3, Provider4, Provider0]);
      expect(mod0.moduleMetadata.providersPerReq).toEqual([...defaultProvidersPerReq, Provider5, Provider6, Provider7]);
    });

    it('Module1', async () => {
      moduleManager.scanRootModule(AppModule);
      await mock.init();
      const mod1 = mock.extensionsMetadataMap.get(Module1);
      expect(mod1.moduleMetadata.providersPerApp).toEqual([]);
      expect(mod1.moduleMetadata.providersPerMod).toEqual([Provider0, Provider3, Provider4, obj1, Provider2]);
      expect(mod1.moduleMetadata.providersPerReq).toEqual([...defaultProvidersPerReq, Provider5, Provider6, Provider7]);
    });

    it('Module2', async () => {
      moduleManager.scanRootModule(AppModule);
      await mock.init();
      const mod2 = mock.extensionsMetadataMap.get(module2WithParams);
      expect(mod2.moduleMetadata.providersPerApp).toEqual([]);
      expect(mod2.moduleMetadata.providersPerMod).toEqual([Provider0, Provider3, Provider4]);
      expect(mod2.moduleMetadata.providersPerReq).toEqual([...defaultProvidersPerReq, Provider5, Provider6, Provider7]);
    });

    it('Module3', async () => {
      moduleManager.scanRootModule(AppModule);
      await mock.init();
      const mod3 = mock.extensionsMetadataMap.get(module3WithParams);
      expect(mod3.moduleMetadata.providersPerApp).toEqual([]);
      expect(mod3.moduleMetadata.providersPerMod).toEqual([Provider0, Provider3, Provider4]);
      expect(mod3.moduleMetadata.providersPerReq).toEqual([...defaultProvidersPerReq, Provider5, Provider6, Provider7]);
    });

    it('Module4', async () => {
      moduleManager.scanRootModule(AppModule);
      await mock.init();
      const mod4 = mock.extensionsMetadataMap.get(module4WithParams);
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

    it('AppModule', async () => {
      moduleManager.scanRootModule(AppModule);
      await mock.init();
      const root1 = mock.extensionsMetadataMap.get(AppModule);
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
});
