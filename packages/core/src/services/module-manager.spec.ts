import 'reflect-metadata';
import * as http from 'http';
import { Injectable, forwardRef } from '@ts-stack/di';

import { RootModule } from '../decorators/root-module';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { ModuleManager } from './module-manager';
import { Module } from '../decorators/module';
import { ModuleWithParams, ServiceProvider, ModuleType, AnyObj } from '../types/mix';
import { LoggerConfig } from '../types/logger';
import { DefaultLogger } from './default-logger';
import { Log } from './log';
import { LogManager } from './log-manager';

describe('ModuleManager', () => {
  type ModuleId = string | ModuleType | ModuleWithParams;

  class MockModuleManager extends ModuleManager {
    override map = new Map<ModuleType | ModuleWithParams, NormalizedModuleMetadata>();
    override mapId = new Map<string, ModuleType | ModuleWithParams>();
    override oldMap = new Map<ModuleType | ModuleWithParams, NormalizedModuleMetadata>();
    override oldMapId = new Map<string, ModuleType | ModuleWithParams>();

    override getRawMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(moduleId: ModuleId, throwErrOnNotFound?: boolean) {
      return super.getRawMetadata<T, A>(moduleId, throwErrOnNotFound);
    }
  }

  let mock: MockModuleManager;

  beforeEach(() => {
    const config = new LoggerConfig();
    const logger = new DefaultLogger(config);
    const logManager = new LogManager();
    const log = new Log(logManager, logger);
    mock = new MockModuleManager(log);
  });

  it('empty root module', () => {
    @RootModule()
    class AppModule {}

    const expectedMetadata = new NormalizedModuleMetadata();
    expectedMetadata.id = '';
    expectedMetadata.name = 'AppModule';
    expectedMetadata.module = AppModule;
    expectedMetadata.ngMetadataName = 'RootModule';

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(1);
    expect(mock.getMetadata('root')).toEqual(expectedMetadata);
  });

  it('non properly exports from root module', () => {
    class Provider1 {}

    @RootModule({
      exports: [Provider1]
    })
    class AppModule {}

    expect(() => mock.scanRootModule(AppModule)).toThrowError(/Importing Provider1 from AppModule should includes in/);
  });

  it('root module with some metadata', () => {
    @Injectable()
    class Provider1 {}

    @RootModule({
      httpModule: http,
      listenOptions: { host: 'localhost', port: 3000 },
      prefixPerApp: 'api',
      serverName: 'Some-Server',
      serverOptions: {},
      imports: [],
      providersPerRou: [],
      providersPerReq: [Provider1],
      extensionsMeta: {},
      controllers: [],
      exports: [],
    })
    class AppModule {}

    const expectedMetadata = new NormalizedModuleMetadata();
    expectedMetadata.id = '';
    expectedMetadata.name = 'AppModule';
    expectedMetadata.module = AppModule;
    expectedMetadata.providersPerReq = [Provider1];
    expectedMetadata.ngMetadataName = 'RootModule';

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(1);
    expect(mock.getMetadata('root')).toEqual(expectedMetadata);
  });

  it('root module with imported some other modules', () => {
    const fn = () => module4WithParams;
    @Module({ id: '1', imports: [forwardRef(fn)] })
    class Module1 {}

    @Injectable()
    class Provider0 {}

    @Injectable()
    class Provider1 {}

    @Module({
      imports: [Module1],
      providersPerMod: [Provider0],
      providersPerRou: [Provider1],
      exports: [Provider0, Provider1, Module1],
    })
    class Module2 {}

    @Module()
    class Module4 {
      static withParams(providersPerMod: ServiceProvider[]): ModuleWithParams<Module4> {
        return {
          module: Module4,
          providersPerMod,
        };
      }
    }

    @Injectable()
    class Provider2 {}

    const module4WithParams = Module4.withParams([Provider2]);

    @RootModule({
      imports: [Module1, Module2],
      providersPerApp: [],
      extensionsMeta: {},
      controllers: [],
      exports: [],
    })
    class Module3 {}

    const module1Expect = new NormalizedModuleMetadata();
    module1Expect.id = '1';
    module1Expect.name = 'Module1';
    module1Expect.module = Module1;
    module1Expect.importsWithParams = [module4WithParams];
    module1Expect.ngMetadataName = 'Module';

    mock.scanRootModule(Module3);
    expect(mock.map.size).toBe(4);
    expect(mock.getMetadata('1')).toEqual(module1Expect);

    const module2Expect = new NormalizedModuleMetadata();
    module2Expect.id = '';
    module2Expect.name = 'Module2';
    module2Expect.module = Module2;
    module2Expect.importsModules = [Module1];
    module2Expect.providersPerMod = [Provider0];
    module2Expect.providersPerRou = [Provider1];
    module2Expect.exportsModules = [Module1];
    module2Expect.exportsProvidersPerMod = [Provider0];
    module2Expect.exportsProvidersPerRou = [Provider1];
    module2Expect.ngMetadataName = 'Module';

    expect(mock.map.get(Module2)).toEqual(module2Expect);

    const module3Expect = new NormalizedModuleMetadata();
    module3Expect.id = '';
    module3Expect.name = 'Module3';
    module3Expect.module = Module3;
    module3Expect.importsModules = [Module1, Module2];
    module3Expect.ngMetadataName = 'RootModule';

    expect(mock.getMetadata('root')).toEqual(module3Expect);

    const module4Expect = new NormalizedModuleMetadata();
    module4Expect.id = '';
    module4Expect.name = 'Module4';
    module4Expect.module = module4WithParams;
    module4Expect.providersPerMod = [Provider2];
    module4Expect.ngMetadataName = 'Module';

    expect(mock.map.get(module4WithParams)).toEqual(module4Expect);
  });

  it('programmatically adding some modules to "imports" array of root module', () => {
    @Injectable()
    class Provider1 {}

    @RootModule({
      imports: [],
      providersPerReq: [Provider1],
      extensionsMeta: {},
      controllers: [],
      exports: [],
    })
    class AppModule {}

    const expectedMetadata1 = new NormalizedModuleMetadata();
    expectedMetadata1.id = '';
    expectedMetadata1.name = 'AppModule';
    expectedMetadata1.module = AppModule;
    expectedMetadata1.providersPerReq = [Provider1];
    expectedMetadata1.ngMetadataName = 'RootModule';

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(1);
    expect(mock.getMetadata('root') === mock.getMetadata('root')).toBe(false);
    expect(mock.getRawMetadata('root') === mock.getRawMetadata('root')).toBe(true);
    expect(mock.getMetadata('root')).toEqual(expectedMetadata1);

    @Module()
    class Module1 {}

    @Module()
    class Module2 {}

    @Module()
    class Module3 {
      static withParams(providersPerMod: ServiceProvider[]): ModuleWithParams<Module3> {
        return {
          module: Module3,
          providersPerMod,
        };
      }
    }

    @Module()
    class Module4 {}

    @Injectable()
    class Provider2 {}

    const module3WithProviders = Module3.withParams([Provider2]);

    const expectedOldMetadata1 = new NormalizedModuleMetadata();
    expectedOldMetadata1.id = '';
    expectedOldMetadata1.name = 'AppModule';
    expectedOldMetadata1.module = AppModule;
    expectedOldMetadata1.providersPerReq = [Provider1];
    expectedOldMetadata1.ngMetadataName = 'RootModule';

    expect(mock.addImport(Module1)).toBe(true);
    expect(mock.map.size).toBe(2);
    expect(mock.oldMapId.size).toBe(1);
    expect(mock.oldMapId.get('root')).toBe(AppModule);
    expect(mock.oldMap.size).toBe(1);
    expect(mock.oldMap.has(AppModule)).toBe(true);
    expect(mock.oldMap.get(AppModule)).toEqual(expectedOldMetadata1);

    expect(mock.addImport(Module1)).toBe(false);
    expect(mock.oldMap.size).toBe(1);
    expect(mock.oldMap.has(AppModule)).toBe(true);
    expect(mock.oldMap.get(AppModule)).toEqual(expectedOldMetadata1);
    expect(mock.map.size).toBe(2);
    expect(mock.map.has(Module1)).toBe(true);

    mock.commit();
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);
    expect(mock.map.size).toBe(2);
    expect(mock.map.has(AppModule)).toBe(true);
    expect(mock.map.has(Module1)).toBe(true);

    expect(() => mock.addImport(Module2, 'fakeId')).toThrowError(/Failed adding Module2 to imports/);
    expect(mock.map.size).toBe(2);

    const expectedOldMetadata2 = new NormalizedModuleMetadata();
    expectedOldMetadata2.id = '';
    expectedOldMetadata2.name = 'AppModule';
    expectedOldMetadata2.module = AppModule;
    expectedOldMetadata2.importsModules = [Module1];
    expectedOldMetadata2.providersPerReq = [Provider1];
    expectedOldMetadata2.ngMetadataName = 'RootModule';

    mock.addImport(Module2);
    expect(mock.map.size).toBe(3);
    expect(mock.oldMap.size).toBe(2);
    expect(mock.oldMap.has(AppModule)).toBe(true);
    expect(mock.oldMap.has(Module1)).toBe(true);
    expect(mock.oldMapId.size).toBe(1);
    expect(mock.oldMapId.get('root')).toBe(AppModule);
    expect(mock.oldMap.get(AppModule)).toEqual(expectedOldMetadata2);

    mock.addImport(Module4);
    expect(mock.map.size).toBe(4);
    expect(mock.map.has(Module4)).toBe(true);
    expect(mock.oldMap.size).toBe(2);
    expect(mock.oldMap.has(AppModule)).toBe(true);
    expect(mock.oldMap.has(Module1)).toBe(true);
    expect(mock.oldMapId.size).toBe(1);
    expect(mock.oldMapId.get('root')).toBe(AppModule);

    mock.commit();
    expect(mock.map.size).toBe(4);
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.has(AppModule)).toBe(false);

    const expectedMetadata2 = new NormalizedModuleMetadata();
    expectedMetadata2.id = '';
    expectedMetadata2.name = 'AppModule';
    expectedMetadata2.module = AppModule;
    expectedMetadata2.importsModules = [Module1, Module2, Module4];
    expectedMetadata2.providersPerReq = [Provider1];
    expectedMetadata2.ngMetadataName = 'RootModule';

    expect(mock.getMetadata('root') === mock.getMetadata('root')).toBe(false);
    expect(mock.getMetadata('root')).toEqual(expectedMetadata2);

    const expectedMetadata3 = new NormalizedModuleMetadata();
    expectedMetadata3.id = '';
    expectedMetadata3.name = 'AppModule';
    expectedMetadata3.module = AppModule;
    expectedMetadata3.importsModules = [Module1, Module2, Module4];
    expectedMetadata3.importsWithParams = [module3WithProviders];
    expectedMetadata3.providersPerReq = [Provider1];
    expectedMetadata3.ngMetadataName = 'RootModule';

    mock.addImport(module3WithProviders);
    expect(mock.map.size).toBe(5);
    expect(mock.oldMap.size).toBe(4);
    expect(mock.getMetadata('root')).toEqual(expectedMetadata3);
    expect(mock.map.has(module3WithProviders)).toBe(true);

    mock.rollback();
    expect(mock.map.size).toBe(4);
    expect(mock.map.get(AppModule)).toEqual(expectedMetadata2);
    expect(mock.map.has(module3WithProviders)).toBe(false);
    expect(mock.oldMap.size).toBe(0);
  });

  it('programmatically removing some modules from "imports" array of root module', () => {
    @Injectable()
    class Provider1 {}

    @Module()
    class Module0 {}

    @Module({ imports: [Module0] })
    class Module1 {}

    @Module({ imports: [Module0] })
    class Module2 {}

    @Module()
    class Module3 {
      static withParams(providersPerMod: ServiceProvider[]): ModuleWithParams<Module3> {
        return {
          module: Module3,
          providersPerMod,
        };
      }
    }

    @Injectable()
    class Provider2 {}

    const module3WithProviders = Module3.withParams([Provider2]);

    const moduleId = 'my-mix';
    @Module()
    class Module4 {
      static withParams(providersPerMod: ServiceProvider[]): ModuleWithParams<Module4> {
        return {
          id: moduleId,
          module: Module4,
          providersPerMod,
        };
      }
    }

    const module4WithProviders = Module4.withParams([Provider2]);

    @RootModule({
      imports: [Module1, Module2, module3WithProviders, module4WithProviders],
      providersPerReq: [Provider1],
      extensionsMeta: {},
      controllers: [],
      exports: [],
    })
    class AppModule {}

    const expectedMetadata1 = new NormalizedModuleMetadata();
    expectedMetadata1.id = '';
    expectedMetadata1.name = 'AppModule';
    expectedMetadata1.module = AppModule;
    expectedMetadata1.importsModules = [Module1, Module2];
    expectedMetadata1.importsWithParams = [module3WithProviders, module4WithProviders];
    expectedMetadata1.providersPerReq = [Provider1];
    expectedMetadata1.ngMetadataName = 'RootModule';

    mock.scanRootModule(AppModule);
    expect(mock.map.size).toBe(6);
    expect(mock.getMetadata('root')).toEqual(expectedMetadata1);
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);

    expect(mock.removeImport(Module0, Module1)).toBe(true);
    expect(mock.map.size).toBe(6);
    expect(mock.map.has(Module0)).toBe(true);
    expect(mock.oldMap.size).toBe(6);
    expect(mock.oldMap.has(Module0)).toBe(true);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMapId.has(moduleId)).toBe(true);
    expect(mock.oldMapId.get('root')).toBe(AppModule);

    expect(mock.removeImport(Module0, Module2)).toBe(true);
    expect(mock.map.size).toBe(5);
    expect(mock.map.has(Module0)).toBe(false);
    expect(mock.oldMap.size).toBe(6);
    expect(mock.oldMap.has(Module0)).toBe(true);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMapId.has(moduleId)).toBe(true);
    expect(mock.oldMapId.get('root')).toBe(AppModule);

    mock.commit();
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);

    const expectedMetadata2 = new NormalizedModuleMetadata();
    expectedMetadata2.id = '';
    expectedMetadata2.name = 'AppModule';
    expectedMetadata2.module = AppModule;
    expectedMetadata2.importsModules = [Module1];
    expectedMetadata2.importsWithParams = [module3WithProviders, module4WithProviders];
    expectedMetadata2.providersPerReq = [Provider1];
    expectedMetadata2.ngMetadataName = 'RootModule';

    expect(mock.removeImport(Module2)).toBe(true);
    expect(mock.map.size).toBe(4);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);

    expect(mock.removeImport(Module2)).toBe(false);
    expect(mock.map.size).toBe(4);
    expect(mock.getMetadata('root')).toEqual(expectedMetadata2);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);

    const expectedMetadata3 = new NormalizedModuleMetadata();
    expectedMetadata3.id = '';
    expectedMetadata3.name = 'AppModule';
    expectedMetadata3.module = AppModule;
    expectedMetadata3.importsModules = [Module1];
    expectedMetadata3.importsWithParams = [module4WithProviders];
    expectedMetadata3.providersPerReq = [Provider1];
    expectedMetadata3.ngMetadataName = 'RootModule';

    expect(mock.removeImport(module3WithProviders)).toBe(true);
    expect(mock.map.size).toBe(3);
    expect(mock.getMetadata('root')).toEqual(expectedMetadata3);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);

    const expectedMetadata4 = new NormalizedModuleMetadata();
    expectedMetadata4.id = '';
    expectedMetadata4.name = 'AppModule';
    expectedMetadata4.module = AppModule;
    expectedMetadata4.importsModules = [Module1];
    expectedMetadata4.providersPerReq = [Provider1];
    expectedMetadata4.ngMetadataName = 'RootModule';

    expect(mock.removeImport(moduleId)).toBe(true);
    expect(mock.map.size).toBe(2);
    expect(mock.getMetadata('root')).toEqual(expectedMetadata4);
    expect(mock.oldMapId.size).toBe(2);
    expect(mock.oldMap.size).toBe(5);

    mock.rollback();
    expect(mock.mapId.size).toBe(2);
    expect(mock.map.size).toBe(5);
    expect(mock.getMetadata('root')).toEqual(expectedMetadata1);
    expect(mock.oldMapId.size).toBe(0);
    expect(mock.oldMap.size).toBe(0);
  });
});
