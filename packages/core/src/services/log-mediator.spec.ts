import 'reflect-metadata';
import { ReflectiveInjector } from '@ts-stack/di';
import { it, jest, describe, beforeEach, expect, afterEach } from '@jest/globals';

import { Providers } from '../utils/providers';
import { Logger, LoggerConfig, LogLevel } from '../types/logger';
import { ConsoleLogger } from './console-logger';
import { LogMediator } from './log-mediator';
import { LogManager } from './log-manager';

describe('LogMediator', () => {
  class LogMediatorMock extends LogMediator {
    testMethod(level: LogLevel, tags: string[] = [], ...args: any[]) {
      this.setLog(level, { tags }, `${args[0]}, ${args[1]}`);
    }
  }

  const loggerMock = {
    log(...args: any[]) {},
    getLevel() {}
  } as Logger;

  let logMediator: LogMediatorMock;

  beforeEach(() => {
    jest.spyOn(loggerMock, 'log');
    const config = new LoggerConfig();
    const logger = new ConsoleLogger(config) as Logger;
    const logManager = new LogManager();
    logMediator = new LogMediatorMock(logManager, logger);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('default state', () => {
    expect(logMediator.bufferLogs).toBe(true);
    expect(logMediator.buffer).toEqual([]);
  });

  it('passing message to the buffer', () => {
    logMediator.testMethod('trace', [], 'one', 'two');
    expect(logMediator.buffer.length).toBe(1);
    expect(logMediator.buffer[0].msgLevel).toEqual('trace');
    expect(logMediator.buffer[0].msg).toEqual('one, two');
    logMediator.flush();
    expect(logMediator.buffer).toEqual([]);
  });

  it('passing message with switch between buffer and logger', () => {
    const injector = ReflectiveInjector.resolveAndCreate([
      LogManager,
      ...new Providers()
        .useClass(LogMediator, LogMediatorMock)
        .useLogger(loggerMock),
    ]);
    const log = injector.get(LogMediator) as LogMediatorMock;

    log.testMethod('trace', [], 'one', 'two');
    expect(log.buffer.length).toBe(1);
    expect(loggerMock.log).toBeCalledTimes(0);
    expect(log.buffer[0].msgLevel).toEqual('trace');
    expect(log.buffer[0].msg).toEqual('one, two');

    log.testMethod('trace', [], 'one', 'two');
    expect(log.buffer.length).toBe(2);
    expect(loggerMock.log).toBeCalledTimes(0);

    log.bufferLogs = false;
    log.testMethod('trace', [], 'one', 'two');
    expect(log.buffer.length).toBe(2);
    expect(loggerMock.log).toBeCalledTimes(1);

    log.testMethod('trace', [], 'one', 'two');
    expect(log.buffer.length).toBe(2);
    expect(loggerMock.log).toBeCalledTimes(2);

    log.flush();
    expect(log.buffer).toEqual([]);
  });
});
