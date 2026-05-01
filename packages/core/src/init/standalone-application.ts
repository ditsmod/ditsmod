import { PublicLogMediator } from '#logger/system-log-mediator.js';
import { BaseAppInitializer, BaseApplication, BaseAppOptions, ModuleType } from '@ditsmod/core';

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
