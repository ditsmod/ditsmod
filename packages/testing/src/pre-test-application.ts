import { Application, AppOptions, OutputLogLevel, Server, SystemLogMediator } from '@ditsmod/core';

import { TestModuleManager } from './test-module-manager.js';
import { TestAppInitializer } from './test-app-initializer.js';

export class PreTestApplication extends Application {
  override init(appOptions: AppOptions, systemLogMediator?: SystemLogMediator) {
    return super.init(appOptions, systemLogMediator);
  }

  bootstrapTestApplication(testModuleManager: TestModuleManager, logLevel: OutputLogLevel) {
    return new Promise<{ server: Server }>(async (resolve, reject) => {
      try {
        const testAppInitializer = new TestAppInitializer(this.appOptions, testModuleManager, this.systemLogMediator);
        this.appInitializer = testAppInitializer;
        testAppInitializer.setInitLogLevel(logLevel);
        await this.bootstrapApplication(testAppInitializer);
        await this.createServerAndBindToListening(testAppInitializer, resolve);
      } catch (err: any) {
        this.systemLogMediator.internalServerError(this, err, true);
        this.flushLogs();
        reject(err);
      }
    });
  }
}
