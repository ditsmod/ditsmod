import { describe, expect, it, beforeEach } from 'vitest';

import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { ModuleManager } from '#init/module-manager.js';
// import { Router } from '#types/router.js';
import { BaseAppOptions } from '#types/app-options.js';
import { ModuleType } from '#types/mix.js';
import { BaseAppInitializer } from '#init/base-app-initializer.js';
import { BaseApplication } from '#init/base-application.js';
import { rootModule } from '#decorators/root-module.js';
import { LogMediator } from '#logger/log-mediator.js';
import { LoggerConfig } from '#logger/logger.js';

describe('BaseApplication', () => {
  class ApplicationMock extends BaseApplication {
    override baseAppOptions = new BaseAppOptions();
    declare systemLogMediator: SystemLogMediator;

    override init(baseAppOptions?: BaseAppOptions) {
      return super.init(baseAppOptions);
    }

    override scanRootModule(appModule: ModuleType) {
      return super.scanRootModule(appModule);
    }

    override bootstrapApplication(baseAppInitializer: BaseAppInitializer) {
      return super.bootstrapApplication(baseAppInitializer);
    }
  }

  let mock: ApplicationMock;

  beforeEach(() => {
    mock = new ApplicationMock();
  });

  describe('init()', () => {
    it('should merge BaseAppOptions with default', () => {
      mock.init({ bufferLogs: false });
      expect(mock.baseAppOptions.bufferLogs).toBe(false);
      expect(LogMediator.bufferLogs).toBe(false);
    });
  });

  describe('scanRootModule()', () => {
    @rootModule({})
    class AppModule {}

    it('should return instance of ModuleManager', () => {
      expect(mock.scanRootModule(AppModule)).toBeInstanceOf(ModuleManager);
    });
  });

  describe('bootstrapApplication()', () => {
    @rootModule({
      providersPerApp: [
        // { token: Router, useValue: {} },
        { token: LoggerConfig, useValue: { level: 'off' } },
      ],
    })
    class AppModule {}

    it('should replace systemLogMediator during call bootstrapApplication()', async () => {
      const moduleManager = mock.scanRootModule(AppModule);
      const baseAppInitializer = new BaseAppInitializer(
        new BaseAppOptions(),
        moduleManager,
        new SystemLogMediator({ moduleName: '' }),
      );
      const { systemLogMediator } = mock;
      await mock.bootstrapApplication(baseAppInitializer);
      expect(mock.systemLogMediator !== systemLogMediator).toBe(true);
    });
  });
});
