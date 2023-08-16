import { Application, LogLevel, ModuleType, Server } from '@ditsmod/core';

import { TestModuleManager } from './test-module-manager';
import { TestAppInitializer } from './test-app-initializer';

export class PreTestApplication extends Application {
  override initRootModule(appModule: ModuleType) {
    return super.initRootModule(appModule);
  }

  bootstrapTestApplication(testModuleManager: TestModuleManager, logLevel: LogLevel, listen: boolean = false) {
    return new Promise<{ server: Server }>(async (resolve, reject) => {
      try {
        const testAppInitializer = new TestAppInitializer(this.rootMeta, testModuleManager, this.systemLogMediator);
        testAppInitializer.setInitLogLevel(logLevel);
        await this.bootstrapApplication(testAppInitializer);
        await this.createServerAndListen(testAppInitializer, resolve, listen);
      } catch (err: any) {
        this.systemLogMediator.internalServerError(this, err, true);
        this.flushLogs();
        reject(err);
      }
    });
  }
}
