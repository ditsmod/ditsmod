import { AppOptions, OutputLogLevel, ModuleType, SystemLogMediator, LoggerConfig, Application, ModuleManager } from '@ditsmod/core';
import { PreRouterExtension } from '@ditsmod/routing';

import { TestModuleManager } from './test-module-manager.js';
import { TestProvider } from './types.js';
import { TestPreRouterExtension } from './test-pre-router.extension.js';
import { TestAppInitializer } from './test-app-initializer.js';

export class TestApplication extends Application {
  protected testModuleManager: TestModuleManager;
  protected logLevel: OutputLogLevel;

  /**
   * @param appModule The root module of the application.
   * @param appOptions Application options.
   */
  static createTestApp(appModule: ModuleType, appOptions?: AppOptions) {
    const app = new this();
    try {
      const config: LoggerConfig = { level: 'off' };
      const systemLogMediator = new SystemLogMediator({ moduleName: 'TestAppModule' }, undefined, undefined, config);
      app.init(appOptions, systemLogMediator);
      if (!app.appOptions.loggerConfig) {
        app.appOptions.loggerConfig = { level: 'off' };
      }
      app.testModuleManager = new TestModuleManager(systemLogMediator);
      app.testModuleManager.setProvidersPerApp([{ token: TestModuleManager, useToken: ModuleManager }]);
      app.testModuleManager.setExtensionProviders([{ token: PreRouterExtension, useClass: TestPreRouterExtension }]);
      app.testModuleManager.scanRootModule(appModule);
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
    this.testModuleManager.overrideProviders(providers);
    return this;
  }

  /**
   * During testing, the logging level is set to `off` by default (any logs are disabled).
   */
  setLogLevel(logLevel: OutputLogLevel) {
    this.logLevel = logLevel;
    this.testModuleManager.logLevel = logLevel;
    return this;
  }

  async getServer() {
    try {
      const testAppInitializer = new TestAppInitializer(
        this.appOptions,
        this.testModuleManager,
        this.systemLogMediator,
      );
      testAppInitializer.setInitLogLevel(this.logLevel);
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
