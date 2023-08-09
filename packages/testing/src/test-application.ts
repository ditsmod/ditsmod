import { Application, ModuleType, Provider, Server } from '@ditsmod/core';

import { TestModuleManager } from './test-module-manager';

export class TestApplication extends Application {
  protected appModule: ModuleType;
  protected testModuleManager: TestModuleManager;

  override initRootModule(appModule: ModuleType) {
    this.appModule = appModule;
    super.initRootModule(appModule);
    this.testModuleManager = new TestModuleManager(this.systemLogMediator);
    this.testModuleManager.scanRootModule(appModule);
    return this;
  }

  overrideProvidersInModule(module: ModuleType, providers: Provider[]) {}
  
  overrideProviders(providers: Provider[]) {
    this.testModuleManager.setProvidersToOverride(providers);
  }

  bootstrapTestApplication(listen: boolean = true) {
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
}
