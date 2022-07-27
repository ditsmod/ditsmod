import { AnyObj, Logger, LoggerConfig } from '@ditsmod/core';

export function setCustomLogger(config: LoggerConfig, service: Logger, customLogger: AnyObj) {
  const levels: (keyof Logger)[] = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];
  levels.forEach((level) => {
    service[level] = (...args: any[]) => {
      if (!args.length) {
        return config.level == level;
      } else {
        service.log(level, ...args);
      }
    };
  });

  service.log = (level: keyof Logger, ...args: any[]) => {
    const [arg1, ...rest] = args;
    customLogger[level](arg1, ...rest);
  };
}