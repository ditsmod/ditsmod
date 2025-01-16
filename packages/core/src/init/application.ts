import { BaseAppOptions } from '#types/app-options.js';
import { PublicLogMediator, SystemLogMediator } from '#logger/system-log-mediator.js';
import { ModuleType } from '#types/mix.js';
import { AppInitializer } from '#init/app-initializer.js';
import { LogMediator } from '#logger/log-mediator.js';
import { ModuleManager } from '#init/module-manager.js';

export abstract class Application {
  protected baseAppOptions: BaseAppOptions;
  protected systemLogMediator: SystemLogMediator;

  protected init(baseAppOptions?: BaseAppOptions) {
    if (Error.stackTraceLimit == 10) {
      Error.stackTraceLimit = 50; // Override default limit.
    }
    this.systemLogMediator = new SystemLogMediator({ moduleName: 'app' });
    this.baseAppOptions = { ...new BaseAppOptions(), ...baseAppOptions };
    LogMediator.bufferLogs = this.baseAppOptions.bufferLogs;
    this.systemLogMediator.startingDitsmod(this); // OutputLogLevel is still unknown here.
  }

  protected scanRootModule(appModule: ModuleType) {
    const moduleManager = new ModuleManager(this.systemLogMediator);
    moduleManager.scanRootModule(appModule);
    return moduleManager;
  }

  protected async bootstrapApplication(appInitializer: AppInitializer) {
    // Here, before init custom logger, works default logger.
    appInitializer.bootstrapProvidersPerApp();
    // Here, after init providers per app, reinit Logger with new config.
    this.systemLogMediator = appInitializer.systemLogMediator;
    (this.systemLogMediator as PublicLogMediator).updateOutputLogLevel();
    await appInitializer.bootstrapModulesAndExtensions();
    // Here, after init extensions, reinit Logger with new config.
    this.systemLogMediator = appInitializer.systemLogMediator;
    (this.systemLogMediator as PublicLogMediator).updateOutputLogLevel();
  }

  protected flushLogs() {
    LogMediator.bufferLogs = false;
    this.systemLogMediator.flush();
  }
}
