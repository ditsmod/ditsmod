import { PublicLogMediator } from '#logger/system-log-mediator.js';
import { ModuleType } from '#types/mix.js';
import { BaseAppInitializer } from './base-app-initializer.js';
import { BaseAppOptions } from './base-app-options.js';
import { BaseApplication } from './base-application.js';

/**
 * This class is primarily used for testing `@ditsmod/core`, and for demonstrating how the application works without a web server.
 * It can also be used as a basic example for building a full-fledged web application (or another application that requires
 * modularity, Dependency Injection, a logger, and extension handling).
 */
export class StandaloneApplication extends BaseApplication {
  /**
   * @param appModule The root module of the application.
   */
  static async create(appModule: ModuleType, baseOptions?: BaseAppOptions) {
    const app = new this();
    try {
      app.init(baseOptions);
      const moduleManager = app.scanRootModule(appModule);
      const baseInitializer = new BaseAppInitializer(app.baseAppOptions, moduleManager, app.log);
      await app.bootstrapApplication(baseInitializer);
      return app;
    } catch (err: any) {
      (app.log as PublicLogMediator).updateOutputLogLevel();
      app.log.internalServerError(app, err);
      app.flushLogs();
      process.exit(1);
    }
  }
}
