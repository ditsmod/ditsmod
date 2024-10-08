import { AppOptions, OutputLogLevel, ModuleType, ModuleManager, SystemLogMediator, LoggerConfig } from '@ditsmod/core';
import { PreRouterExtension } from '@ditsmod/routing';

import { PreTestApplication } from './pre-test-application.js';
import { TestModuleManager } from './test-module-manager.js';
import { TestProvider } from './types.js';
import { TestPreRouterExtension } from './test-pre-router.extensions.js';

// This class is only needed as a wrapper over the PreTestApplication
// class to hide the bootstrap() method from the public API.
export class TestApplication {
  protected preTestApplication: PreTestApplication;
  protected testModuleManager: TestModuleManager;
  protected logLevel: OutputLogLevel;

  constructor(appModule: ModuleType, appOptions: AppOptions = new AppOptions()) {
    this.initAndScanRootModule(appModule, appOptions);
  }

  protected initAndScanRootModule(appModule: ModuleType, appOptions: AppOptions) {
    this.preTestApplication = new PreTestApplication();
    const config: LoggerConfig = { level: 'off' };
    const systemLogMediator = new SystemLogMediator({ moduleName: 'TestAppModule' }, undefined, undefined, config);
    this.preTestApplication.init(appOptions, systemLogMediator);
    this.testModuleManager = new TestModuleManager(systemLogMediator);
    this.testModuleManager.setProvidersPerApp([{ token: TestModuleManager, useToken: ModuleManager }]);
    this.testModuleManager.setExtensionProviders([{ token: PreRouterExtension, useClass: TestPreRouterExtension }]);
    this.testModuleManager.scanRootModule(appModule);
    return this.testModuleManager;
  }

  /**
   * Overrides providers at any level if there are matching providers (they have the same tokens)
   * at those levels. Therefore, this method does not always add providers to the DI.
   */
  overrideProviders(providers: TestProvider[]) {
    this.testModuleManager.overrideProviders(providers);
    return this;
  }

  /**
   * During testing, the logging level is set to `off` by default (any logs are disabled).
   */
  setLogLevel(logLevel: OutputLogLevel) {
    this.logLevel = logLevel;
    this.testModuleManager.setLogLevel(logLevel);
    return this;
  }

  async getServer() {
    const { server } = await this.preTestApplication.bootstrapTestApplication(this.testModuleManager, this.logLevel);
    return server;
  }
}
