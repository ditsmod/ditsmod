import { jest } from '@jest/globals';

import { Injector, Provider } from '#di';
import { ModuleExtract } from '#models/module-extract.js';
import { InputLogLevel } from '#types/logger.js';
import { LogMediator } from './log-mediator.js';
import { SystemLogMediator } from './system-log-mediator.js';

describe('SystemLogMediator', () => {
  class SystemLogMediatorMock extends SystemLogMediator {
    testMethod(level: InputLogLevel, ...args: any[]) {
      this.setLog(level, `${args[0]}, ${args[1]}`);
    }
  }

  function getLogMediator(providers?: Provider[]): SystemLogMediatorMock {
    const injector = Injector.resolveAndCreate([ModuleExtract, SystemLogMediatorMock, ...(providers || [])]);

    return injector.get(SystemLogMediatorMock);
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('testMethod()', () => {
    it("LogMediator's default state", () => {
      expect(LogMediator.bufferLogs).toBe(true);
      expect(LogMediator.buffer).toEqual([]);
    });

    it('passing message to the buffer', () => {
      LogMediator.bufferLogs = true;
      const logMediator = getLogMediator();
      logMediator.testMethod('trace', 'one', 'two');
      expect(LogMediator.buffer.length).toBe(1);
      expect(LogMediator.buffer[0].inputLogLevel).toEqual('trace');
      expect(LogMediator.buffer[0].msg).toEqual('one, two');
      logMediator.flush();
      expect(LogMediator.buffer).toEqual([]);
    });

    it('passing message with switch between buffer and logger', () => {
      LogMediator.bufferLogs = true;
      const logMediator = getLogMediator();
      const { logger } = logMediator as any;
      jest.spyOn(logger, 'log');

      logMediator.testMethod('trace', 'one', 'two');
      expect(LogMediator.buffer.length).toBe(1);
      expect(logger.log).toBeCalledTimes(0);
      expect(LogMediator.buffer[0].inputLogLevel).toEqual('trace');
      expect(LogMediator.buffer[0].msg).toEqual('one, two');

      logMediator.testMethod('trace', 'one', 'two');
      expect(LogMediator.buffer.length).toBe(2);
      expect(logger.log).toBeCalledTimes(0);

      LogMediator.bufferLogs = false;
      logMediator.testMethod('trace', 'one', 'two');
      expect(LogMediator.buffer.length).toBe(2);
      expect(logger.log).toBeCalledTimes(1);

      logMediator.testMethod('trace', 'one', 'two');
      expect(LogMediator.buffer.length).toBe(2);
      expect(logger.log).toBeCalledTimes(2);

      logMediator.flush();
      expect(LogMediator.buffer).toEqual([]);
      expect(logger.log).toBeCalledTimes(4);
    });
  });
});
