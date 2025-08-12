import { BaseAppOptions } from '#init/base-app-options.js';
import { PublicLogMediator, SystemLogMediator } from '#logger/system-log-mediator.js';
import { ModuleType } from '#types/mix.js';
import { BaseAppInitializer } from '#init/base-app-initializer.js';
import { LogMediator } from '#logger/log-mediator.js';
import { ModuleManager } from '#init/module-manager.js';
import { SystemErrorMediator } from '#error/system-error-mediator.js';

export abstract class BaseApplication {
  protected baseAppOptions: BaseAppOptions;
  protected systemLogMediator: SystemLogMediator;
  protected systemErrMediator: SystemErrorMediator;

  protected init(baseAppOptions?: BaseAppOptions) {
    if (Error.stackTraceLimit == 10) {
      Error.stackTraceLimit = 50; // Override default limit.
    }
    this.systemLogMediator = new SystemLogMediator({ moduleName: 'app' });
    this.systemErrMediator = new SystemErrorMediator({ moduleName: 'app' });
    this.baseAppOptions = { ...new BaseAppOptions(), ...baseAppOptions };
    LogMediator.bufferLogs = this.baseAppOptions.bufferLogs;
    this.systemLogMediator.startingDitsmod(this); // OutputLogLevel is still unknown here.
  }

  protected scanRootModule(appModule: ModuleType) {
    const moduleManager = new ModuleManager(this.systemLogMediator, this.systemErrMediator);
    moduleManager.scanRootModule(appModule);
    return moduleManager;
  }

  protected async bootstrapApplication(baseAppInitializer: BaseAppInitializer) {
    // Here, before init custom logger, works default logger.
    baseAppInitializer.bootstrapProvidersPerApp();
    // Here, after init providers per app, reinit Logger with new config.
    this.systemLogMediator = baseAppInitializer.systemLogMediator;
    (this.systemLogMediator as PublicLogMediator).updateOutputLogLevel();
    await baseAppInitializer.bootstrapModulesAndExtensions();
    // Here, after init extensions, reinit Logger with new config.
    this.systemLogMediator = baseAppInitializer.systemLogMediator;
    (this.systemLogMediator as PublicLogMediator).updateOutputLogLevel();
  }

  protected flushLogs() {
    LogMediator.bufferLogs = false;
    this.systemLogMediator.flush();
  }
}
