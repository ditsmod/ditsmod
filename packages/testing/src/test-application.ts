import { AppOptions, ModuleType, SystemLogMediator, Application } from '@ditsmod/core';

import { TestProvider } from './types.js';
import { TestAppInitializer } from './test-app-initializer.js';

export class TestApplication extends Application {
  protected testAppInitializer: TestAppInitializer;

  /**
   * @param appModule The root module of the application.
   * @param appOptions Application options.
   */
  static createTestApp(appModule: ModuleType, appOptions?: AppOptions) {
    const app = new this();
    try {
      app.init(appOptions);
      if (!app.appOptions.loggerConfig) {
        app.appOptions.loggerConfig = { level: 'off' };
      }
      const moduleManager = app.scanRootModule(appModule);
      app.testAppInitializer = new TestAppInitializer(app.appOptions, moduleManager, app.systemLogMediator);
      return app;
    } catch (err: any) {
      app.handleError(err);
      throw err;
    }
  }

  /**
   * Overrides providers at any level if there are matching providers (they have the same tokens)
   * at those levels. Therefore, this method does not always add providers to the DI.
   */
  overrideProviders(providers: TestProvider[]) {
    this.testAppInitializer.overrideProviders(providers);
    return this;
  }

  async getServer() {
    try {
      await this.bootstrapApplication(this.testAppInitializer);
      await this.createServerAndBindToListening(this.testAppInitializer);
      return this.server;
    } catch (err: any) {
      this.handleError(err);
      throw err;
    }
  }

  protected handleError(err: any) {
    (this.systemLogMediator as PublicLogMediator).updateOutputLogLevel();
    this.systemLogMediator.internalServerError(this, err, true);
    this.flushLogs();
  }
}

/**
 * This class is needed only to access the protected methods of the `LogMediator` class.
 */
class PublicLogMediator extends SystemLogMediator {
  override updateOutputLogLevel() {
    return super.updateOutputLogLevel();
  }
}
