import { Application, LogLevel, ModuleManager, ModuleType, Server, NormalizedProvider } from '@ditsmod/core';

import { TestModuleManager } from './test-module-manager';
import { TestAppInitializer } from './test-app-initializer';

export class PreTestApplication extends Application {
  protected appModule: ModuleType;
  protected testModuleManager: TestModuleManager;
  protected logLevel: LogLevel;

  constructor(appModule: ModuleType) {
    super();
    this.initRootModule(appModule);
  }

  protected override initRootModule(appModule: ModuleType) {
    this.appModule = appModule;
    super.initRootModule(appModule);
    this.testModuleManager = new TestModuleManager(this.systemLogMediator);
    this.testModuleManager.scanRootModule(appModule);
  }

  /**
   * Overrides providers at any level if there are matching providers at those levels
   * (they have the same tokens). Therefore, unlike the `setProvidersPerApp()` method,
   * this method does not always add providers to the DI.
   * 
   * In most cases, this is the method you need.
   */
  overrideProviders(providers: NormalizedProvider[]) {
    this.testModuleManager.overrideProviders(providers);
  }

  /**
   * Adds providers at the application level. This method is intended, for example,
   * to set the level of logs during testing, etc.
   * 
   * If you need to _override_ a specific provider at the application level,
   * you should use the `overrideProviders()` method instead.
   */
  setProvidersPerApp(providers: NormalizedProvider[]) {
    this.testModuleManager.setProvidersPerApp(providers);
  }

  /**
   * This setting of log level only works during initialization,
   * before HTTP request handlers are created.
   */
  setLogLevelForInit(logLevel: LogLevel) {
    this.logLevel = logLevel;
  }

  async getServer(listen: boolean = false) {
    const { server } = await this.bootstrapTestApplication(listen);
    return server;
  }

  protected bootstrapTestApplication(listen: boolean = false) {
    return new Promise<{ server: Server }>(async (resolve, reject) => {
      try {
        const testAppInitializer = this.getAppInitializer(this.testModuleManager);
        testAppInitializer.setLogLevelForInit(this.logLevel);
        await this.bootstrapApplication(testAppInitializer);
        this.finishBootstrap(testAppInitializer, resolve, listen);
      } catch (err: any) {
        this.systemLogMediator.internalServerError(this, err, true);
        this.flushLogs();
        reject(err);
      }
    });
  }

  protected override getAppInitializer(moduleManager: ModuleManager) {
    return new TestAppInitializer(this.rootMeta, moduleManager, this.systemLogMediator);
  }
}
