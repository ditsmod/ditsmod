import { Application, LogLevel, ModuleManager, ModuleType, Provider, Server } from '@ditsmod/core';

import { TestModuleManager } from './test-module-manager';
import { TestAppInitializer } from './test-app-initializer';

export class TestApplication extends Application {
  protected appModule: ModuleType;
  protected testModuleManager: TestModuleManager;
  protected logLevel: LogLevel;

  override initRootModule(appModule: ModuleType) {
    this.appModule = appModule;
    super.initRootModule(appModule);
    this.testModuleManager = new TestModuleManager(this.systemLogMediator);
    this.testModuleManager.scanRootModule(appModule);
    return this;
  }

  overrideProviders(providers: Provider[]) {
    this.testModuleManager.setProvidersToOverride(providers);
    return this;
  }

  /**
   * This setting of log level only works during initialization,
   * before HTTP request handlers are created.
   */
  setLogLevelForInit(logLevel: LogLevel) {
    this.logLevel = logLevel;
    return this;
  }

  bootstrapTestApplication(listen: boolean = false) {
    return new Promise<{ server: Server }>(async (resolve, reject) => {
      try {
        const appInitializer = this.getAppInitializer(this.testModuleManager);
        await this.bootstrapApplication(appInitializer);
        this.finishBootstrap(appInitializer, resolve, listen);
      } catch (err: any) {
        this.systemLogMediator.internalServerError(this, err, true);
        this.flushLogs();
        reject(err);
      }
    });
  }

  protected override getAppInitializer(moduleManager: ModuleManager) {
    const testAppInitializer = new TestAppInitializer(this.rootMeta, moduleManager, this.systemLogMediator);
    testAppInitializer.setLogLevelForInit(this.logLevel);
    return testAppInitializer;
  }
}
