import {
  AppOptions,
  ModuleType,
  SystemLogMediator,
  Application,
  Providers,
  ExtensionsGroupToken,
  Class,
  UnionToIntersection,
  ModRefId,
} from '@ditsmod/core';

import { GroupMetaOverrider, TestProvider } from './types.js';
import { TestAppInitializer } from './test-app-initializer.js';
import { TestModuleManager } from './test-module-manager.js';

export class TestApplication extends Application {
  protected testAppInitializer: TestAppInitializer;
  protected testModuleManager: TestModuleManager;
  protected appModule: ModuleType;

  /**
   * @param appModule The root module of the application.
   * @param appOptions Application options.
   */
  static createTestApp(appModule: ModuleType, appOptions?: AppOptions) {
    const app = new this();
    try {
      app.init(appOptions);
      app.appModule = appModule;
      if (!app.appOptions.loggerConfig) {
        app.appOptions.loggerConfig = { level: 'off' };
      }
      app.testModuleManager = new TestModuleManager(app.systemLogMediator);
      app.testAppInitializer = new TestAppInitializer(app.appOptions, app.testModuleManager, app.systemLogMediator);
      return app;
    } catch (err: any) {
      app.handleError(err);
      throw err;
    }
  }

  /**
   * Marks modules as external (those installed via package managers like npm, yarn, etc).
   * As a result, they will not accept global providers that the application exports from
   * the root module. Useful when you want to test how external modules will behave.
   * 
   * @param modRefId The module reference ID. If you import the module as an object,
   * it is this object that must be passed to this method.
   */
  markModuleAsExternal(...modRefId: ModRefId[]) {
    this.testModuleManager.markModuleAsExternal(modRefId);
    return this;
  }

  /**
   * Overrides providers at any level if there are matching providers (they have the same tokens)
   * at those levels. Therefore, this method does not always add providers to the DI.
   *
   * This method has the word "static" in its name, because it overrides the providers that are
   * set statically in the metadata of the module or controller.
   *
   * @param providers Providers to override.
   */
  overrideStatic(providers: Providers | TestProvider[]) {
    this.testAppInitializer.overrideStatic(providers);
    return this;
  }

  /**
   * This method has the word "dynamic" in its name, because it overrides providers that are set
   * dynamically using extensions.
   *
   * @param providers Providers to override.
   */
  overrideDynamic<T>(groupToken: ExtensionsGroupToken<T>, override: GroupMetaOverrider<T>) {
    this.testAppInitializer.setOverriderConfig({ groupToken, override });
    return this;
  }

  async getServer() {
    try {
      this.testModuleManager.scanRootModule(this.appModule);
      await this.bootstrapApplication(this.testAppInitializer);
      await this.createServerAndBindToListening(this.testAppInitializer);
      return this.server;
    } catch (err: any) {
      this.handleError(err);
      throw err;
    }
  }

  /**
 * ### Plugins
 * 
 * This method allows you to dynamically extend this class using plugins:
 * 
 * ```ts
import { TestApplication } from '@ditsmod/testing';

class Plugin1 extends TestApplication {
  method1() {
    // ...
    return this;
  }
}

class Plugin2 extends TestApplication {
  method2() {
    // ...
    return this;
  }
}

class AppModule {}

TestApplication.createTestApp(AppModule)
  .$use(Plugin1, Plugin2)
  .method1()
  .method2()
  .overrideStatic([]);
 * ```
 * 
 * That is, after using the `.$use()` method, you will be able to use plugin methods.
 * Additionally, each method must return `this`.
 * 
 * __Warning__: Plugins cannot use arrow functions as methods, as they will not work.
 */
  $use<T extends [Class<TestApplication>, ...Class<TestApplication>[]]>(...Plugins: T) {
    Plugins.forEach((Plugin) => {
      Object.getOwnPropertyNames(Plugin.prototype)
        .filter((p) => p != 'constructor')
        .forEach((p) => {
          (this as any)[p] = Plugin.prototype[p];
        });
    });

    return this as UnionToIntersection<InstanceType<T[number]>> & this;
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
