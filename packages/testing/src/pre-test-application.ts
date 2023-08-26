import { Application, ApplicationOptions, LogLevel, Server } from '@ditsmod/core';

import { TestModuleManager } from './test-module-manager.js';
import { TestAppInitializer } from './test-app-initializer.js';

export class PreTestApplication extends Application {
  override init(rootModuleName: string, appOptions: ApplicationOptions) {
    return super.init(rootModuleName, appOptions);
  }

  bootstrapTestApplication(testModuleManager: TestModuleManager, logLevel: LogLevel) {
    return new Promise<{ server: Server }>(async (resolve, reject) => {
      try {
        const testAppInitializer = new TestAppInitializer(this.rootMeta, testModuleManager, this.systemLogMediator);
        testAppInitializer.setInitLogLevel(logLevel);
        await this.bootstrapApplication(testAppInitializer);
        await this.createServerAndListen(testAppInitializer, resolve);
      } catch (err: any) {
        this.systemLogMediator.internalServerError(this, err, true);
        this.flushLogs();
        reject(err);
      }
    });
  }
}
