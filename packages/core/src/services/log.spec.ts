import 'reflect-metadata';
import { ReflectiveInjector } from '@ts-stack/di';

import { Logger, LoggerConfig } from '../types/logger';
import { DefaultLogger } from './default-logger';
import { Log } from './log';
import { LogManager } from './log-manager';

describe('Log', () => {
  const loggerSpy = jest.fn();

  class LogMock extends Log {
    testMethod(level: keyof Logger, tags: string[] = [], ...args: any[]) {
      this.setLog(level, tags, `${args[0]}, ${args[1]}`);
    }
  }

  class LoggerMock {
    log(level: keyof Logger, ...args: any[]) {
      loggerSpy(level, ...args);
    }
  }

  let log: LogMock;

  beforeEach(() => {
    loggerSpy.mockRestore();
    const config = new LoggerConfig();
    const logger = new DefaultLogger(config) as Logger;
    const logManager = new LogManager();
    log = new LogMock(logManager, logger);
  });

  it('default state', () => {
    expect(log.bufferLogs).toBe(true);
    expect(log.buffer).toEqual([]);
  });

  it(`passing message to the buffer`, () => {
    log.testMethod('trace', [], 'one', 'two');
    expect(log.buffer.length).toBe(1);
    expect(log.buffer[0].level).toEqual('trace');
    expect(log.buffer[0].msg).toEqual('one, two');
    log.flush();
    expect(log.buffer).toEqual([]);
  });

  it(`passing message with switch between buffer and logger`, () => {
    const injector = ReflectiveInjector.resolveAndCreate([
      { provide: Log, useClass: LogMock },
      { provide: Logger, useClass: LoggerMock },
      LogManager,
    ]);
    const log = injector.get(Log) as LogMock;

    log.testMethod('trace', [], 'one', 'two');
    expect(log.buffer.length).toBe(1);
    expect(loggerSpy.mock.calls.length).toBe(0);
    expect(log.buffer[0].level).toEqual('trace');
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
