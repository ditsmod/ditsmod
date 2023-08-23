import { ApplicationOptions, LogLevel, ModuleType } from '@ditsmod/core';

import { PreTestApplication } from './pre-test-application';
import { TestModuleManager } from './test-module-manager';
import { TestProvider } from './types';

// This class is only needed as a wrapper over the PreTestApplication
// class to hide the bootstrap() method from the public API.
export class TestApplication {
  protected preTestApplication: PreTestApplication;
  protected testModuleManager: TestModuleManager;
  protected logLevel: LogLevel;
  protected appModule: ModuleType;

  constructor(appModule: ModuleType, appOptions: ApplicationOptions = new ApplicationOptions()) {
    this.appModule = appModule;
    this.preTestApplication = new PreTestApplication();
    this.initRootModule(appModule, appOptions);
  }

  protected initRootModule(appModule: ModuleType, appOptions: ApplicationOptions) {
    const systemLogMediator = this.preTestApplication.init(appModule.name, appOptions);
    this.testModuleManager = new TestModuleManager(systemLogMediator);
    this.testModuleManager.scanRootModule(appModule);
    return this.testModuleManager;
  }

  /**
   * Overrides providers at any level if there are matching providers (they have the same tokens)
   * at those levels. Therefore, unlike the `setProvidersPerApp()` method,
   * this method does not always add providers to the DI.
   */
  overrideProviders(providers: TestProvider[]) {
    this.testModuleManager.overrideProviders(providers);
    return this;
  }

  /**
   * During testing, the logging level is set to `off` by default (any logs are disabled).
   */
  setLogLevel(logLevel: LogLevel) {
    this.logLevel = logLevel;
    this.testModuleManager.setLogLevel(logLevel);
    return this;
  }

  async getServer() {
    const { server } = await this.preTestApplication.bootstrapTestApplication(this.testModuleManager, this.logLevel);
    return server;
  }
}
