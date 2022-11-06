import 'reflect-metadata';
import { Provider, ReflectiveInjector } from '@ts-stack/di';
import { it, jest, describe, beforeEach, expect, afterEach } from '@jest/globals';

import { LogLevel } from '../types/logger';
import { LogMediator } from './log-mediator';
import { ModuleExtract } from '../models/module-extract';
import { SystemLogMediator } from './system-log-mediator';

describe('SystemLogMediator', () => {
  class SystemLogMediatorMock extends SystemLogMediator {
    testMethod(level: LogLevel, tags: string[] = [], ...args: any[]) {
      this.setLog(level, { tags }, `${args[0]}, ${args[1]}`);
    }
  }

  function getLogMediator(providers?: Provider[]): SystemLogMediatorMock {
    const injector = ReflectiveInjector.resolveAndCreate([
      ModuleExtract,
      SystemLogMediatorMock,
      ...(providers || [])
    ]);

    return injector.get(SystemLogMediatorMock);
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it(`LogMediator's default state`, () => {
    expect(LogMediator.bufferLogs).toBe(true);
    expect(LogMediator.buffer).toEqual([]);
  });

  it('passing message to the buffer', () => {
    const logMediator = getLogMediator();
    logMediator.testMethod('trace', [], 'one', 'two');
    expect(LogMediator.buffer.length).toBe(1);
    expect(LogMediator.buffer[0].msgLevel).toEqual('trace');
    expect(LogMediator.buffer[0].msg).toEqual('one, two');
    logMediator.flush();
    expect(LogMediator.buffer).toEqual([]);
  });

  it('passing message with switch between buffer and logger', () => {
    const logMediator = getLogMediator();
    const loggerMock = (logMediator as any).logger;
    jest.spyOn((logMediator as any).logger, 'log');
    logMediator.testMethod('trace', [], 'one', 'two');
    expect(LogMediator.buffer.length).toBe(1);
    expect(loggerMock.log).toBeCalledTimes(0);
    expect(LogMediator.buffer[0].msgLevel).toEqual('trace');
    expect(LogMediator.buffer[0].msg).toEqual('one, two');

    logMediator.testMethod('trace', [], 'one', 'two');
    expect(LogMediator.buffer.length).toBe(2);
    expect(loggerMock.log).toBeCalledTimes(0);

    LogMediator.bufferLogs = false;
    logMediator.testMethod('trace', [], 'one', 'two');
    expect(LogMediator.buffer.length).toBe(2);
    expect(loggerMock.log).toBeCalledTimes(1);

    logMediator.testMethod('trace', [], 'one', 'two');
    expect(LogMediator.buffer.length).toBe(2);
    expect(loggerMock.log).toBeCalledTimes(2);

    logMediator.flush();
    expect(LogMediator.buffer).toEqual([]);
  });
});
