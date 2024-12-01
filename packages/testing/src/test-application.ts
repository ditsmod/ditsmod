import { AppOptions, ModuleType, SystemLogMediator, Application, ModuleManager, Provider } from '@ditsmod/core';

import { TestModuleManager } from './test-module-manager.js';
import { TestProvider } from './types.js';
import { TestAppInitializer } from './test-app-initializer.js';

export class TestApplication extends Application {
  protected testModuleManager: TestModuleManager;

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
      app.testModuleManager = new TestModuleManager(app.systemLogMediator);
      app.testModuleManager.setProvidersPerApp([{ token: TestModuleManager, useToken: ModuleManager }]);
      app.testModuleManager.scanRootModule(appModule);
      return app;
    } catch (err: any) {
      app.handleError(err);
      throw err;
    }
  }

  setExtensionProviders(extensionsProviders: Provider[]) {
    this.testModuleManager.setExtensionProviders(extensionsProviders);
    return this;
  }

  /**
   * Overrides providers at any level if there are matching providers (they have the same tokens)
   * at those levels. Therefore, this method does not always add providers to the DI.
   */
  overrideProviders(providers: TestProvider[]) {
    this.testModuleManager.overrideProviders(providers);
    return this;
  }

  async getServer() {
    try {
      const testAppInitializer = new TestAppInitializer(
        this.appOptions,
        this.testModuleManager,
        this.systemLogMediator,
      );
      await this.bootstrapApplication(testAppInitializer);
      await this.createServerAndBindToListening(testAppInitializer);
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
