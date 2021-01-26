import { Logger } from '@ts-stack/ditsmod';

export function getNamedLogggerMethod(fnLevel: keyof Logger) {
  return (...args: any[]) => {
    if (!args.length) {
      return this.config.level == fnLevel;
    } else {
      const [param1, ...restParams] = args;
      this.logger.log(fnLevel, param1, ...restParams);
    }
  };
}
