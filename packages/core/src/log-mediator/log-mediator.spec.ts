import 'reflect-metadata';
import { ReflectiveInjector } from '@ts-stack/di';
import { it, jest, describe, beforeEach, expect, afterEach } from '@jest/globals';

import { Providers } from '../utils/providers';
import { Logger, LoggerConfig, LogLevel } from '../types/logger';
import { ConsoleLogger } from '../services/console-logger';
import { LogMediator } from './log-mediator';
import { ModuleExtract } from '../models/module-extract';
import { SystemLogMediator } from './system-log-mediator';

describe('SystemLogMediator', () => {
  class SystemLogMediatorMock extends SystemLogMediator {
    testMethod(level: LogLevel, tags: string[] = [], ...args: any[]) {
      this.setLog(level, { tags }, `${args[0]}, ${args[1]}`);
    }
  }

  const loggerMock = {
    log(...args: any[]) {},
    getLevel() {},
  } as Logger;

  let mock: SystemLogMediatorMock;

  beforeEach(() => {
    jest.spyOn(loggerMock, 'log');
    const config = new LoggerConfig();
    const logger = new ConsoleLogger(config) as Logger;
    mock = new SystemLogMediatorMock({ moduleName: 'fakeName' }, logger);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('default state', () => {
    expect(LogMediator.bufferLogs).toBe(true);
    expect(LogMediator.buffer).toEqual([]);
  });

  it('passing message to the buffer', () => {
    mock.testMethod('trace', [], 'one', 'two');
    expect(LogMediator.buffer.length).toBe(1);
    expect(LogMediator.buffer[0].msgLevel).toEqual('trace');
    expect(LogMediator.buffer[0].msg).toEqual('one, two');
    mock.flush();
    expect(LogMediator.buffer).toEqual([]);
  });

  it('passing message with switch between buffer and logger', () => {
    const injector = ReflectiveInjector.resolveAndCreate([
      ModuleExtract,
      SystemLogMediatorMock,
      ...new Providers()
        .useLogger(loggerMock),
    ]);
    const log = injector.get(SystemLogMediatorMock) as SystemLogMediatorMock;

    log.testMethod('trace', [], 'one', 'two');
    expect(LogMediator.buffer.length).toBe(1);
    expect(loggerMock.log).toBeCalledTimes(0);
    expect(LogMediator.buffer[0].msgLevel).toEqual('trace');
    expect(LogMediator.buffer[0].msg).toEqual('one, two');

    log.testMethod('trace', [], 'one', 'two');
    expect(LogMediator.buffer.length).toBe(2);
    expect(loggerMock.log).toBeCalledTimes(0);

    LogMediator.bufferLogs = false;
    log.testMethod('trace', [], 'one', 'two');
    expect(LogMediator.buffer.length).toBe(2);
    expect(loggerMock.log).toBeCalledTimes(1);

    log.testMethod('trace', [], 'one', 'two');
    expect(LogMediator.buffer.length).toBe(2);
    expect(loggerMock.log).toBeCalledTimes(2);

    log.flush();
    expect(LogMediator.buffer).toEqual([]);
  });
});
