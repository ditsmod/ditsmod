import 'reflect-metadata';
import { ClassProvider, Injectable, InjectionToken, ReflectiveInjector } from '@ts-stack/di';

import { AppInitializer } from './app-initializer';
import { Logger, LoggerConfig } from '../types/logger';
import { Router } from '../types/router';
import { Request } from './request';
import { ModuleType, ModuleWithParams, ServiceProvider, Extension } from '../types/mix';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { Module } from '../decorators/module';
import { RootModule } from '../decorators/root-module';
import { RootMetadata } from '../models/root-metadata';
import { DefaultLogger } from './default-logger';
import { ModuleManager } from './module-manager';
import { defaultProvidersPerReq } from './default-providers-per-req';
import { MetadataPerMod1 } from '../types/metadata-per-mod';
import { SiblingMap } from '../models/sibling-map';
import { Controller } from '../decorators/controller';
import { ModConfig } from '../models/mod-config';
import { NODE_REQ } from '../constans';
import { Log } from './log';
import { LogManager } from './log-manager';
import { Route } from '../decorators/route';

describe('AppInitializer', () => {
  type M = ModuleType | ModuleWithParams;
  type S = SiblingMap;

  @Injectable()
  class AppInitializerMock extends AppInitializer {
    override meta = new RootMetadata();

    constructor(public override moduleManager: ModuleManager, public override log: Log) {
      super(moduleManager, log);
    }

    override mergeMetadata(appModule: ModuleType) {
      return super.mergeMetadata(appModule);
    }

    override collectProvidersPerAppAndExtensions(meta: NormalizedModuleMetadata, moduleManager: ModuleManager) {
      return super.collectProvidersPerAppAndExtensions(meta, moduleManager);
    }

    override prepareProvidersPerApp(meta: NormalizedModuleMetadata, moduleManager: ModuleManager) {
      return super.prepareProvidersPerApp(meta, moduleManager);
    }
  }

  let mock: AppInitializerMock;
  let moduleManager: ModuleManager;

  beforeEach(async () => {
    const injectorPerApp = ReflectiveInjector.resolveAndCreate([
      AppInitializerMock,
      LoggerConfig,
      Log,
      ModuleManager,
      { provide: Logger, useClass: DefaultLogger },
      // { provide: LogManager, useValue: new LogManager() }
      LogManager
    ]);
    mock = injectorPerApp.get(AppInitializerMock);
    moduleManager = injectorPerApp.get(ModuleManager);
  });

  describe('init()', () => {

    fit('logs should collects between two init()', async () => {
      @Controller()
      class Ctrl {
        @Route('GET')
        method() {}
      }

      @Module({ controllers: [Ctrl] })
      class Module1 {}

      @RootModule({
        imports: [Module1]
      })
      class AppModule {}
      moduleManager.scanRootModule(AppModule);

      await mock.initAndGetMetadata();
    });
  });
});
