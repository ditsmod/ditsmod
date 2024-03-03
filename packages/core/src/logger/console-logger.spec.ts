import { jest } from '@jest/globals';

import { ConsoleLogger } from '#logger/console-logger.js';
import { InputLogLevel } from '#logger/logger.js';

describe('ConsoleLogger', () => {
  const inputLogLevels: InputLogLevel[] = ['all', 'trace', 'debug', 'info', 'warn', 'error', 'fatal'];
  jest.spyOn(console, 'log');

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('"off" log level', () => {
    const logger = new ConsoleLogger();
    expect(() => logger.setLevel('off')).not.toThrow();
    expect(logger.getLevel() == 'off').toBe(true);
    inputLogLevels.forEach((level) => logger.log(level, 'test'));
    expect(console.log).toHaveBeenCalledTimes(0);
  });

  it('"info" (default) log level', () => {
    const logger = new ConsoleLogger();
    expect(logger.getLevel() == 'info').toBe(true);
    inputLogLevels.forEach((level) => logger.log(level, 'test'));
    expect(console.log).toHaveBeenCalledTimes(4);
    expect(console.log).toHaveBeenNthCalledWith(1, '[ConsoleLogger:info]', 'test');
    expect(console.log).toHaveBeenNthCalledWith(2, '[ConsoleLogger:warn]', 'test');
    expect(console.log).toHaveBeenNthCalledWith(3, '[ConsoleLogger:error]', 'test');
    expect(console.log).toHaveBeenNthCalledWith(4, '[ConsoleLogger:fatal]', 'test');
  });

  it('"error" log level', () => {
    const logger = new ConsoleLogger();
    expect(() => logger.setLevel('error')).not.toThrow();
    expect(logger.getLevel() == 'error').toBe(true);
    inputLogLevels.forEach((level) => logger.log(level, 'test'));
    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenNthCalledWith(1, '[ConsoleLogger:error]', 'test');
    expect(console.log).toHaveBeenNthCalledWith(2, '[ConsoleLogger:fatal]', 'test');
  });
});
