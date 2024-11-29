import { factoryMethod, optional } from '#di/decorators.js';
import { AppOptions } from '#types/app-options.js';
import { ConsoleLogger } from './console-logger.js';
import { LoggerConfig } from './logger.js';

export class PatchLogger {
  @factoryMethod()
  patchLogger(
    @optional() config: LoggerConfig = new LoggerConfig(),
    @optional() appOptions: AppOptions = new AppOptions(),
  ) {
    const logger = new ConsoleLogger(config, appOptions);

    return logger;
  }
}
