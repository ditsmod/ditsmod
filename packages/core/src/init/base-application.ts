import { BaseAppOptions } from '#init/base-app-options.js';
import type { PublicLogMediator} from '#logger/system-log-mediator.js';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import type { ModuleType } from '#types/mix.js';
import type { BaseAppInitializer } from '#init/base-app-initializer.js';
import { LogMediator } from '#logger/log-mediator.js';
import { ModuleManager } from '#init/module-manager.js';

export abstract class BaseApplication {
  protected baseAppOptions: BaseAppOptions;
  protected log: SystemLogMediator;

  /**
   * Initializes the application's base settings, configures global log buffering,
   * and adjusts the stack trace limit for better debugging.
   */
  protected init(baseAppOptions?: BaseAppOptions) {
    this.log = new SystemLogMediator({ moduleName: 'app' });
    this.baseAppOptions = { ...new BaseAppOptions(), ...baseAppOptions };
    if (Error.stackTraceLimit == 10) {
      Error.stackTraceLimit = this.baseAppOptions.stackTraceLimit!;
    }

    // Determine whether logs should be collected in a buffer during the bootstrap phase.
    LogMediator.bufferLogs = this.baseAppOptions.bufferLogs;

    // Log the startup event. Note: The actual OutputLogLevel is determined later in the bootstrap.
    this.log.startingDitsmod(this);
  }

  /**
   * Initializes the ModuleManager and starts the recursive scanning process
   * for the root module and all its dependencies.
   */
  protected scanRootModule(appModule: ModuleType) {
    const moduleManager = new ModuleManager(this.log);
    moduleManager.scanRootModule(appModule);
    return moduleManager;
  }

  /**
   * Bootstraps the application by sequentially initializing providers, modules, and extensions.
   * It also manages the transition of the Logger from its default state to custom configurations.
   */
  protected async bootstrapApplication(baseAppInitializer: BaseAppInitializer) {
    // Phase 1: The default Logger is active until application-level providers are initialized.
    baseAppInitializer.bootstrapProvidersPerApp();

    // Phase 2: Application-level providers are ready. Re-initialize the Logger with the new configuration.
    this.log = baseAppInitializer.log;
    (this.log as PublicLogMediator).updateOutputLogLevel();

    await baseAppInitializer.bootstrapModulesAndExtensions();

    // Phase 3: Extensions are initialized. Re-initialize the Logger again to reflect any extension-specific configs.
    this.log = baseAppInitializer.log;
    (this.log as PublicLogMediator).updateOutputLogLevel();
  }

  protected flushLogs() {
    LogMediator.bufferLogs = false;
    this.log.flush();
  }
}
