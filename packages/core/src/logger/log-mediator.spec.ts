import { jest } from '@jest/globals';

import { Injector } from '#di';
import { ConsoleLogger } from '#logger/console-logger.js';
import { InputLogLevel, Logger, OutputLogLevel } from '#logger/logger.js';
import { LogMediator } from '#logger/log-mediator.js';
import { LogItem } from '#logger/types.js';

describe('LogMediator', () => {
  class MockLogMediator extends LogMediator {
    override logger: Logger = new ConsoleLogger();
    static override hasDiffLogLevels: boolean;

    override setLog(inputLogLevel: InputLogLevel, msg: any) {
      return super.setLog(inputLogLevel, msg);
    }

    static override checkDiffLogLevels(level: OutputLogLevel) {
      return super.checkDiffLogLevels(level);
    }

    override writeLogs(logItems: LogItem[]) {
      return super.writeLogs(logItems);
    }
  }

  beforeEach(() => {
    console.log = jest.fn();
  });

  describe('checkDiffLogLevels()', () => {
    it('default: LogMediator.hasDiffLogLevels is undefined', () => {
      expect(MockLogMediator.hasDiffLogLevels).toBeFalsy();
    });

    it('after seted one log level, still LogMediator.hasDiffLogLevels is undefined', () => {
      MockLogMediator.checkDiffLogLevels('all');
      MockLogMediator.checkDiffLogLevels('all');
      expect(MockLogMediator.hasDiffLogLevels).toBeFalsy();
    });

    it('after seted two diff log level, LogMediator.hasDiffLogLevels === true', () => {
      MockLogMediator.checkDiffLogLevels('info');
      expect(MockLogMediator.hasDiffLogLevels).toBe(true);
    });
  });

  describe('setLog()', () => {
    const mock = new MockLogMediator({ moduleName: 'fakeName' });
    beforeEach(() => {
      jest.resetAllMocks();
      jest.spyOn(mock.logger, 'log');
    });

    it('default state', () => {
      expect(LogMediator.buffer).toEqual([]);
      expect(mock.logger.log).toHaveBeenCalledTimes(0);
    });

    it('logging some log', () => {
      mock.setLog('all', 'some log');
      expect(LogMediator.buffer.length).toBe(0);
      expect(mock.logger.log).toHaveBeenCalledTimes(1);
    });

    it('buffering some log', () => {
      LogMediator.bufferLogs = true;
      mock.setLog('all', 'some log');
      expect(LogMediator.buffer.length).toBe(1);
      expect(mock.logger.log).toHaveBeenCalledTimes(0);
    });
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
        jest.resetAllMocks();
        jest.spyOn(mock.logger, 'log');
      });

      it('works without log items', () => {
        expect(() => mock.writeLogs([])).not.toThrow();
        expect(mock.writeLogs([])).toBeInstanceOf(ConsoleLogger);
        expect(mock.writeLogs([]).getLevel()).toBe('info');
        expect(mock.logger.log).toHaveBeenCalledTimes(0);
        expect(console.log).toHaveBeenCalledTimes(0);
      });

      it('works with log items', () => {
        expect(() => mock.writeLogs([baseLogItem])).not.toThrow();
        expect(mock.logger.log).toHaveBeenCalledTimes(0); // writeLogs() creates a separate logger instance.
        expect(console.log).toHaveBeenCalledTimes(1);
        expect(mock.writeLogs([baseLogItem])).toBeInstanceOf(ConsoleLogger);
      });

      it('changes log level only for local logger', () => {
        const logger1 = mock.writeLogs([{ ...baseLogItem, outputLogLevel: 'debug' }]);
        expect(logger1.getLevel()).toBe('debug');
        const logger2 = mock.writeLogs([{ ...baseLogItem, outputLogLevel: 'off' }]);
        expect(logger2.getLevel()).toBe('off');
        expect(mock.logger.getLevel()).toBe('info');
      });
    });

    describe('with passing injector to the constructor', () => {
      const injector = Injector.resolveAndCreate([{ token: Logger, useClass: ConsoleLogger }]);
      const mock = new MockLogMediator({ moduleName: 'fakeName' }, injector);
      beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(mock.logger, 'log');
      });

      it('works with log items', () => {
        expect(() => mock.writeLogs([baseLogItem])).not.toThrow();
        expect(mock.logger.log).toHaveBeenCalledTimes(0); // writeLogs() creates a separate logger instance.
        expect(console.log).toHaveBeenCalledTimes(1);
      });

      it('always creates new instance of a logger', () => {
        expect(mock.writeLogs([]) !== mock.writeLogs([])).toBe(true);
      });

      it('changes log level only for local logger', () => {
        const logger1 = mock.writeLogs([{ ...baseLogItem, outputLogLevel: 'debug' }]);
        expect(logger1.getLevel()).toBe('debug');
        const logger2 = mock.writeLogs([{ ...baseLogItem, outputLogLevel: 'off' }]);
        expect(logger2.getLevel()).toBe('off');
        expect(mock.logger.getLevel()).toBe('info');
      });
    });
  });
});
