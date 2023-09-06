import { jest } from '@jest/globals';

import { Injector, Provider } from '#di';
import { ModuleExtract } from '#models/module-extract.js';
import { ConsoleLogger } from '#services/console-logger.js';
import { LogMediator } from './log-mediator.js';
import { LogItem } from './types.js';

describe('LogMediator', () => {
  class MockLogMediator extends LogMediator {
    override writeLogs(logItems: LogItem[]) {
      return super.writeLogs(logItems);
    }
  }

  function getLogMediator(providers?: Provider[]): MockLogMediator {
    const injector = Injector.resolveAndCreate([ModuleExtract, MockLogMediator, ...(providers || [])]);
    return injector.get(MockLogMediator);
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('writeLogs()', () => {
    const baseLogItem: LogItem = {
      moduleName: 'fakeName1',
      date: new Date(),
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
      console.log = jest.fn();
      jest.spyOn(baseLogItem.logger, 'log');
      logMediator.writeLogs([item1]);
      expect(console.log).toBeCalledTimes(1);
      expect(baseLogItem.logger.log).toBeCalledTimes(1);
      expect(baseLogItem.logger.log).toBeCalledWith(item1.inputLogLevel, item1.msg);
      expect(baseLogItem.logger.getConfig().level).toBe('info');
    });

    it('inputLogLevel < outputLogLevel', () => {
      const item1: LogItem = {
        ...baseLogItem,
        msg: 'fake message 2',
        inputLogLevel: 'debug',
      };

      const logMediator = getLogMediator();
      console.log = jest.fn();
      jest.spyOn(baseLogItem.logger, 'log');
      logMediator.writeLogs([item1]);
      expect(console.log).toBeCalledTimes(0);
      expect(baseLogItem.logger.log).toBeCalledTimes(1);
      expect(baseLogItem.logger.log).toBeCalledWith(item1.inputLogLevel, item1.msg);
      expect(baseLogItem.logger.getConfig().level).toBe('info');
    });
  });
});
