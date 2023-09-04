import { jest } from '@jest/globals';

import { Injector, Provider } from '#di';
import { ModuleExtract } from '#models/module-extract.js';
import { ConsoleLogger } from '#services/console-logger.js';
import { LogLevel } from '#types/logger.js';
import { LogMediator } from './log-mediator.js';
import { LogItem } from './types.js';

describe('LogMediator', () => {
  class LogMediatorMock extends LogMediator {
    override writeLogs(logItems: LogItem[], logLevel?: LogLevel) {
      return super.writeLogs(logItems, logLevel);
    }
  }

  function getLogMediator(providers?: Provider[]): LogMediatorMock {
    const injector = Injector.resolveAndCreate([ModuleExtract, LogMediatorMock, ...(providers || [])]);
    return injector.get(LogMediatorMock);
  }

  afterEach(() => {
    console.log = jest.fn();
    jest.restoreAllMocks();
  });

  describe('writeLogs()', () => {
    const baseLogItem: LogItem = {
      moduleName: 'fakeName1',
      date: new Date(),
      outputLogLevel: 'info',
      inputLogLevel: 'info',
      logger: new ConsoleLogger(),
      msg: 'fake messge 1',
    };

    it('inputLogLevel == outputLogLevel', () => {
      const item1: LogItem = {
        ...baseLogItem,
        msg: 'fake message 2'
      };

      const logMediator = getLogMediator();
      jest.spyOn(baseLogItem.logger, 'log');
      jest.spyOn(console, 'log');
      logMediator.writeLogs([item1]);
      expect(console.log).toBeCalledTimes(1);
      expect(baseLogItem.logger.log).toBeCalledTimes(1);
      expect(baseLogItem.logger.log).toBeCalledWith(item1.inputLogLevel, item1.msg);
      expect(baseLogItem.logger.getLevel()).toBe('info'); // Restored previous log level.
    });

    it('inputLogLevel < outputLogLevel', () => {
      const item1: LogItem = {
        ...baseLogItem,
        msg: 'fake message 2',
        inputLogLevel: 'debug',
        outputLogLevel: 'error',
      };

      const logMediator = getLogMediator();
      jest.spyOn(baseLogItem.logger, 'log');
      jest.spyOn(console, 'log');
      logMediator.writeLogs([item1]);
      expect(console.log).toBeCalledTimes(0);
      expect(baseLogItem.logger.log).toBeCalledTimes(1);
      expect(baseLogItem.logger.log).toBeCalledWith(item1.inputLogLevel, item1.msg);
      expect(baseLogItem.logger.getLevel()).toBe('info'); // Restored previous log level.
    });
  });
});
