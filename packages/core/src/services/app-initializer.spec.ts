import 'reflect-metadata';
import { Injectable } from '@ts-stack/di';

import { AppInitializer } from './app-initializer';
import { Logger, LoggerConfig } from '../types/logger';
import { Router } from '../types/router';
import { ModuleType, ModuleWithParams } from '../types/mix';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { RootModule } from '../decorators/root-module';
import { RootMetadata } from '../models/root-metadata';
import { DefaultLogger } from './default-logger';
import { ModuleManager } from './module-manager';
import { SiblingTokens } from '../models/sibling-tokens';
import { Log } from './log';
import { LogManager } from './log-manager';

describe('AppInitializer', () => {
  type M = ModuleType | ModuleWithParams;
  type S = SiblingTokens;

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

  describe('init()', () => {
    it('case 1', async () => {
      const loggerSpy = jest.fn();

      class LogMock extends Log {
        override flush() {
          loggerSpy((this._logger as any).config.level);
          super.flush();
        }
      }

      // Simulation of a call from the Application
      const config1 = new LoggerConfig();
      config1.level = 'info';
      const logger = new DefaultLogger(config1) as Logger;
      const logManager = new LogManager();
      const log = new LogMock(logger, logManager);
      moduleManager = new ModuleManager(log);
      mock = new AppInitializerMock(moduleManager, log);

      // Simulation of a call from the AppModule
      const config2 = new LoggerConfig();
      config2.level = 'trace';
      @RootModule({
        providersPerApp: [
          Router,
          { provide: LoggerConfig, useValue: config2 },
          { provide: Log, useClass: LogMock },
        ],
      })
      class AppModule {}

      moduleManager.scanRootModule(AppModule);
      await mock.initAndGetMetadata();
      // Here log used from Application
      log.flush();
      expect(loggerSpy.mock.calls[0]).toEqual(['trace']);
    });
  });
});
