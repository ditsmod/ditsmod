import { jest } from '@jest/globals';

import { Injector } from '#di';
import { ConsoleLogger } from '#services/console-logger.js';
import { Logger } from '#types/logger.js';
import { LogMediator } from './log-mediator.js';
import { LogItem } from './types.js';

describe('LogMediator', () => {
  class MockLogMediator extends LogMediator {
    override logger: Logger = new ConsoleLogger();

    override writeLogs(logItems: LogItem[]) {
      return super.writeLogs(logItems);
    }
  }

  beforeEach(() => {
    console.log = jest.fn();
  });

  describe('writeLogs()', () => {
    const baseLogItem: LogItem = {
      moduleName: 'fakeName1',
      date: new Date(),
      inputLogLevel: 'info',
      outputLogLevel: 'info',
      msg: 'fake messge 1',
    };

    describe('without passing injector to the constructor', () => {
      const mock = new MockLogMediator({ moduleName: 'fakeName' });
      beforeEach(() => {
        jest.spyOn(mock.logger, 'log');
      });

      it('works without log items', () => {
        expect(() => mock.writeLogs([])).not.toThrow();
        expect(mock.writeLogs([])).toBeInstanceOf(ConsoleLogger);
        expect(mock.writeLogs([]).getConfig().level).toBe('info');
        expect(mock.logger.log).toBeCalledTimes(0);
        expect(console.log).toBeCalledTimes(0);
      });

      it('works with log items', () => {
        expect(() => mock.writeLogs([baseLogItem])).not.toThrow();
        expect(mock.logger.log).toBeCalledTimes(0);
        expect(console.log).toBeCalledTimes(1);
        expect(mock.writeLogs([baseLogItem])).toBeInstanceOf(ConsoleLogger);
      });

      it('changes log level only for local logger', () => {
        const logger1 = mock.writeLogs([{ ...baseLogItem, outputLogLevel: 'debug' }]);
        expect(logger1.getConfig().level).toBe('debug');
        const logger2 = mock.writeLogs([{ ...baseLogItem, outputLogLevel: 'off' }]);
        expect(logger2.getConfig().level).toBe('off');
        expect(mock.logger.getConfig().level).toBe('info');
      });
    });

    describe('with passing injector to the constructor', () => {
      const injector = Injector.resolveAndCreate([{ token: Logger, useClass: ConsoleLogger }]);
      const mock = new MockLogMediator({ moduleName: 'fakeName' }, injector);
      beforeEach(() => {
        jest.spyOn(mock.logger, 'log');
      });

      it('works with log items', () => {
        expect(() => mock.writeLogs([baseLogItem])).not.toThrow();
        expect(mock.logger.log).toBeCalledTimes(0);
        expect(console.log).toBeCalledTimes(1);
      });

      it('always creates new instance of a logger', () => {
        expect(mock.writeLogs([]) !== mock.writeLogs([])).toBe(true);
      });

      it('changes log level only for local logger', () => {
        const logger1 = mock.writeLogs([{ ...baseLogItem, outputLogLevel: 'debug' }]);
        expect(logger1.getConfig().level).toBe('debug');
        const logger2 = mock.writeLogs([{ ...baseLogItem, outputLogLevel: 'off' }]);
        expect(logger2.getConfig().level).toBe('off');
        expect(mock.logger.getConfig().level).toBe('info');
      });
    });
  });
});
