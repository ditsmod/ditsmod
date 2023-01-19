import { Logger, LogLevel } from '../types/logger';

/**
 * This class is used to limit log output by certain options.
 * Uses by `LogMediator`.
 */
export class OutputLogFilter {
  modulesNames?: string[];
  classesNames?: string[];
  tags?: string[];
}
/**
 * This class is used to generate logs that will be used for `OutputLogFilter`.
 * Uses by `LogMediator`.
 */
export class InputLogFilter {
  className?: string;
  tags?: string[];
}

/**
 * Default type for `LogMediator.buffer`.
 */
export interface LogItem {
  moduleName: string;
  date: Date;
  outputLogFilter: OutputLogFilter;
  outputLogLevel: LogLevel;
  inputLogFilter: InputLogFilter;
  inputLogLevel: LogLevel;
  msg: string;
  logger: Logger;
}
