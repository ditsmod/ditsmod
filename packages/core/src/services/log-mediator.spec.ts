import 'reflect-metadata';
import { ReflectiveInjector } from '@ts-stack/di';

import { Logger, LoggerConfig, LogLevel } from '../types/logger';
import { ConsoleLogger } from './console-logger';
import { LogMediator } from './log-mediator';
import { LogManager } from './log-manager';

describe('Log', () => {
  const loggerSpy = jest.fn();

  class LogMediatorMock extends LogMediator {
    testMethod(level: LogLevel, tags: string[] = [], ...args: any[]) {
      this.setLog(level, { tags }, `${args[0]}, ${args[1]}`);
    }
  }

  class LoggerMock {
    log(level: keyof Logger, ...args: any[]) {
      loggerSpy(level, ...args);
    }
  }

  let logMediator: LogMediatorMock;

  beforeEach(() => {
    loggerSpy.mockRestore();
    const config = new LoggerConfig();
    const logger = new ConsoleLogger(config) as Logger;
    const logManager = new LogManager();
    logMediator = new LogMediatorMock(logManager, logger);
  });

  it('default state', () => {
    expect(logMediator.bufferLogs).toBe(true);
    expect(logMediator.buffer).toEqual([]);
  });

  it('passing message to the buffer', () => {
    logMediator.testMethod('trace', [], 'one', 'two');
    expect(logMediator.buffer.length).toBe(1);
    expect(logMediator.buffer[0].messageLevel).toEqual('trace');
    expect(logMediator.buffer[0].msg).toEqual('one, two');
    logMediator.flush();
    expect(logMediator.buffer).toEqual([]);
  });

  it('passing message with switch between buffer and logger', () => {
    const injector = ReflectiveInjector.resolveAndCreate([
      { provide: LogMediator, useClass: LogMediatorMock },
      { provide: Logger, useClass: LoggerMock },
      LogManager,
    ]);
    const log = injector.get(LogMediator) as LogMediatorMock;

    log.testMethod('trace', [], 'one', 'two');
    expect(log.buffer.length).toBe(1);
    expect(loggerSpy.mock.calls.length).toBe(0);
    expect(log.buffer[0].messageLevel).toEqual('trace');
    expect(log.buffer[0].msg).toEqual('one, two');

    log.testMethod('trace', [], 'one', 'two');
    expect(log.buffer.length).toBe(2);
    expect(loggerSpy.mock.calls.length).toBe(0);

    log.bufferLogs = false;
    log.testMethod('trace', [], 'one', 'two');
    expect(log.buffer.length).toBe(2);
    expect(loggerSpy.mock.calls.length).toBe(1);

    log.testMethod('trace', [], 'one', 'two');
    expect(log.buffer.length).toBe(2);
    expect(loggerSpy.mock.calls.length).toBe(2);

    log.flush();
    expect(log.buffer).toEqual([]);
  });
});
