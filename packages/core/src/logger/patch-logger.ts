import { factoryMethod, optional } from '#di/decorators.js';
import { BaseAppOptions } from '#types/app-options.js';
import { ConsoleLogger } from './console-logger.js';
import { LoggerConfig } from './logger.js';

export class PatchLogger {
  @factoryMethod()
  patchLogger(
    @optional() config: LoggerConfig = new LoggerConfig(),
    @optional() baseAppOptions: BaseAppOptions = new BaseAppOptions(),
  ) {
    const logger = new ConsoleLogger(config, baseAppOptions);

    return logger;
  }
}
