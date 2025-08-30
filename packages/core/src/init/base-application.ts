import { BaseAppOptions } from '#init/base-app-options.js';
import { PublicLogMediator, SystemLogMediator } from '#logger/system-log-mediator.js';
import { ModuleType } from '#types/mix.js';
import { BaseAppInitializer } from '#init/base-app-initializer.js';
import { LogMediator } from '#logger/log-mediator.js';
import { ModuleManager } from '#init/module-manager.js';

export abstract class BaseApplication {
  protected baseAppOptions: BaseAppOptions;
  protected log: SystemLogMediator;

  protected init(baseAppOptions?: BaseAppOptions) {
    if (Error.stackTraceLimit == 10) {
      Error.stackTraceLimit = 50; // Override default limit.
    }
    this.log = new SystemLogMediator({ moduleName: 'app' });
    this.baseAppOptions = { ...new BaseAppOptions(), ...baseAppOptions };
    LogMediator.bufferLogs = this.baseAppOptions.bufferLogs;
    this.log.startingDitsmod(this); // OutputLogLevel is still unknown here.
  }

  protected scanRootModule(appModule: ModuleType) {
    const moduleManager = new ModuleManager(this.log);
    moduleManager.scanRootModule(appModule);
    return moduleManager;
  }

  protected async bootstrapApplication(baseAppInitializer: BaseAppInitializer) {
    // Here, before init custom logger, works default logger.
    baseAppInitializer.bootstrapProvidersPerApp();
    // Here, after init providers per app, reinit Logger with new config.
    this.log = baseAppInitializer.log;
    (this.log as PublicLogMediator).updateOutputLogLevel();
    await baseAppInitializer.bootstrapModulesAndExtensions();
    // Here, after init extensions, reinit Logger with new config.
    this.log = baseAppInitializer.log;
    (this.log as PublicLogMediator).updateOutputLogLevel();
    await baseAppInitializer.resetRequestListener();
  }

  protected flushLogs() {
    LogMediator.bufferLogs = false;
    this.log.flush();
  }
}
