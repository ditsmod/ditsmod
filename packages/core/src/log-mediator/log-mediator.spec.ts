import 'reflect-metadata';
import { Provider, ReflectiveInjector } from '../di';

import { LogItem, LogMediator, OutputLogFilter } from './log-mediator';
import { ModuleExtract } from '../models/module-extract';
import { ConsoleLogger } from '../services/console-logger';
import { LogLevel } from '../types/logger';

describe('LogMediator', () => {
  class LogMediatorMock extends LogMediator {
    override applyLogFilter(buffer: LogItem[]) {
      return super.applyLogFilter(buffer);
    }

    override detectedDifferentLogFilters(uniqFilters: Map<OutputLogFilter, string>) {
      return super.detectedDifferentLogFilters(uniqFilters);
    }

    override getWarnAboutEmptyFilteredLogs(uniqFilters: Map<OutputLogFilter, string>) {
      return super.getWarnAboutEmptyFilteredLogs(uniqFilters);
    }

    override isFilteredLog(item: LogItem, outputLogFilter: OutputLogFilter, prefix?: string) {
      return super.isFilteredLog(item, outputLogFilter, prefix);
    }

    override writeLogs(logItems: LogItem[], logLevel?: LogLevel) {
      return super.writeLogs(logItems, logLevel);
    }
  }

  function getLogMediator(providers?: Provider[]): LogMediatorMock {
    const injector = ReflectiveInjector.resolveAndCreate([ModuleExtract, LogMediatorMock, ...(providers || [])]);

    return injector.get(LogMediatorMock);
  }

  afterEach(() => {
    console.log = jest.fn();
    jest.restoreAllMocks();
  });

  describe(`applyLogFilter()`, () => {
    const baseLogItem: LogItem = {
      moduleName: 'fakeName1',
      date: new Date(),
      outputLogFilter: {},
      outputLogLevel: 'debug',
      inputLogLevel: 'error',
      inputLogFilter: {},
      logger: new ConsoleLogger(),
      msg: 'fake messge 1',
    };

    it(`works with empty input and output log filters`, () => {
      const buffer: LogItem[] = [
        { ...baseLogItem },
        { ...baseLogItem, msg: 'fake message 2' },
        { ...baseLogItem, moduleName: 'fakeName2', msg: 'fake message 3' },
      ];
      const logMediator = getLogMediator();
      jest.spyOn(logMediator, 'detectedDifferentLogFilters');
      jest.spyOn(logMediator, 'getWarnAboutEmptyFilteredLogs');

      expect(logMediator.applyLogFilter(buffer)).toEqual(buffer);
      expect(logMediator.detectedDifferentLogFilters).toBeCalledTimes(0);
      expect(logMediator.getWarnAboutEmptyFilteredLogs).toBeCalledTimes(0);
    });

    it(`works with filtered items by module name`, () => {
      const outputLogFilter = new OutputLogFilter();
      outputLogFilter.modulesNames = [baseLogItem.moduleName];

      const item1: LogItem = {
        ...baseLogItem,
        msg: 'fake message 2',
        inputLogFilter: { className: 'class1' },
        outputLogFilter,
      };

      const item2: LogItem = {
        ...baseLogItem,
        msg: 'fake message 3',
        inputLogFilter: { tags: ['tag1', 'tag2'] },
        outputLogFilter,
      };

      const buffer: LogItem[] = [item1, item2];
      const logMediator = getLogMediator();
      jest.spyOn(logMediator, 'detectedDifferentLogFilters');
      jest.spyOn(logMediator, 'getWarnAboutEmptyFilteredLogs');

      expect(logMediator.applyLogFilter(buffer)).toEqual([item1, item2]);
      expect(logMediator.detectedDifferentLogFilters).toBeCalledTimes(0);
      expect(logMediator.getWarnAboutEmptyFilteredLogs).toBeCalledTimes(0);
    });

    it(`works with filtered items by class name`, () => {
      const outputLogFilter = new OutputLogFilter();
      outputLogFilter.classesNames = ['class1'];

      const item1: LogItem = {
        ...baseLogItem,
        msg: 'fake message 2',
        inputLogFilter: { className: 'class1' },
        outputLogFilter,
      };

      const item2: LogItem = {
        ...baseLogItem,
        moduleName: 'fakeName2',
        msg: 'fake message 3',
        inputLogFilter: { tags: ['tag1', 'tag2'] },
        outputLogFilter,
      };

      const buffer: LogItem[] = [item1, item2];
      const logMediator = getLogMediator();
      jest.spyOn(logMediator, 'detectedDifferentLogFilters');
      jest.spyOn(logMediator, 'getWarnAboutEmptyFilteredLogs');

      expect(logMediator.applyLogFilter(buffer)).toEqual([item1]);
      expect(logMediator.detectedDifferentLogFilters).toBeCalledTimes(0);
      expect(logMediator.getWarnAboutEmptyFilteredLogs).toBeCalledTimes(0);
    });

    it(`works with filtered items by tag name`, () => {
      const outputLogFilter = new OutputLogFilter();
      outputLogFilter.tags = ['tag2'];

      const item1: LogItem = {
        ...baseLogItem,
        msg: 'fake message 2',
        inputLogFilter: { className: 'class1' },
        outputLogFilter,
      };

      const item2: LogItem = {
        ...baseLogItem,
        moduleName: 'fakeName2',
        msg: 'fake message 3',
        inputLogFilter: { tags: ['tag1', 'tag2'] },
        outputLogFilter,
      };

      const buffer: LogItem[] = [item1, item2];
      const logMediator = getLogMediator();
      jest.spyOn(logMediator, 'detectedDifferentLogFilters');
      jest.spyOn(logMediator, 'getWarnAboutEmptyFilteredLogs');

      expect(logMediator.applyLogFilter(buffer)).toEqual([item2]);
      expect(logMediator.detectedDifferentLogFilters).toBeCalledTimes(0);
      expect(logMediator.getWarnAboutEmptyFilteredLogs).toBeCalledTimes(0);
    });

    it(`works with two different output log filters`, () => {
      const item1: LogItem = {
        ...baseLogItem,
        msg: 'fake message 2',
        inputLogFilter: { className: 'class1' },
        outputLogFilter: { classesNames: ['class1'] },
      };

      const item2: LogItem = {
        ...baseLogItem,
        moduleName: 'fakeName2',
        msg: 'fake message 3',
        inputLogFilter: { tags: ['tag1', 'tag2'] },
        outputLogFilter: { tags: ['tag1'] },
      };

      const buffer: LogItem[] = [item1, item2];
      const logMediator = getLogMediator();
      jest.spyOn(logMediator, 'detectedDifferentLogFilters');
      jest.spyOn(logMediator, 'getWarnAboutEmptyFilteredLogs');

      expect(logMediator.applyLogFilter(buffer)).toEqual([item1, item2]);
      expect(logMediator.detectedDifferentLogFilters).toBeCalledTimes(1);
      expect(logMediator.getWarnAboutEmptyFilteredLogs).toBeCalledTimes(0);
    });

    it(`works with empty output log buffer`, () => {
      const outputLogFilter = new OutputLogFilter();
      outputLogFilter.classesNames = ['class1'];

      const item1: LogItem = {
        ...baseLogItem,
        msg: 'fake message 2',
        inputLogFilter: { className: 'class2' },
        outputLogFilter,
      };

      const item2: LogItem = {
        ...baseLogItem,
        moduleName: 'fakeName2',
        msg: 'fake message 3',
        inputLogFilter: { tags: ['tag1', 'tag2'] },
        outputLogFilter,
      };

      const buffer: LogItem[] = [item1, item2];
      const logMediator = getLogMediator();
      jest.spyOn(logMediator, 'detectedDifferentLogFilters');
      jest.spyOn(logMediator, 'getWarnAboutEmptyFilteredLogs');

      const result = logMediator.applyLogFilter(buffer);
      expect(result.length).toBe(1);
      expect(result[0].msg).toMatch(/no logs to display/);
      expect(logMediator.detectedDifferentLogFilters).toBeCalledTimes(0);
      expect(logMediator.getWarnAboutEmptyFilteredLogs).toBeCalledTimes(1);
    });
  });

  describe(`isFilteredLog()`, () => {
    const baseLogItem: LogItem = {
      moduleName: 'fakeName1',
      date: new Date(),
      outputLogFilter: {},
      outputLogLevel: 'debug',
      inputLogLevel: 'error',
      inputLogFilter: {},
      logger: new ConsoleLogger(),
      msg: 'fake messge 1',
    };

    it(`filter not matched by module name`, () => {
      const outputLogFilter = new OutputLogFilter();
      outputLogFilter.modulesNames = ['module2'];

      const item1: LogItem = {
        ...baseLogItem,
        moduleName: 'module3',
        inputLogFilter: { className: 'class2' },
        outputLogFilter,
      };

      const logMediator = getLogMediator();
      const result = logMediator.isFilteredLog(item1, outputLogFilter);
      expect(result).toBe(false);
    });

    it(`filter matched by module name`, () => {
      const outputLogFilter = new OutputLogFilter();
      outputLogFilter.modulesNames = ['module3'];

      const item1: LogItem = {
        ...baseLogItem,
        moduleName: 'module3',
        inputLogFilter: { className: 'class2' },
        outputLogFilter,
      };

      const logMediator = getLogMediator();
      const result = logMediator.isFilteredLog(item1, outputLogFilter);
      expect(result).toBe(true);
    });

    it(`filter not matched by class name`, () => {
      const outputLogFilter = new OutputLogFilter();
      outputLogFilter.classesNames = ['class1'];

      const item1: LogItem = {
        ...baseLogItem,
        msg: 'fake message 2',
        inputLogFilter: { className: 'class2' },
        outputLogFilter,
      };

      const logMediator = getLogMediator();
      const result = logMediator.isFilteredLog(item1, outputLogFilter);
      expect(result).toBe(false);
    });

    it(`filter matched by class name`, () => {
      const outputLogFilter = new OutputLogFilter();
      outputLogFilter.classesNames = ['class2'];

      const item1: LogItem = {
        ...baseLogItem,
        msg: 'fake message 2',
        inputLogFilter: { className: 'class2' },
        outputLogFilter,
      };

      const logMediator = getLogMediator();
      const result = logMediator.isFilteredLog(item1, outputLogFilter);
      expect(result).toBe(true);
    });

    it(`filter not matched by tag name`, () => {
      const outputLogFilter = new OutputLogFilter();
      outputLogFilter.tags = ['tag4'];

      const item1: LogItem = {
        ...baseLogItem,
        msg: 'fake message 2',
        inputLogFilter: { className: 'class2', tags: ['tag3'] },
        outputLogFilter,
      };

      const logMediator = getLogMediator();
      const result = logMediator.isFilteredLog(item1, outputLogFilter);
      expect(result).toBe(false);
    });

    it(`filter matched by tag name`, () => {
      const outputLogFilter = new OutputLogFilter();
      outputLogFilter.tags = ['tag4'];

      const item1: LogItem = {
        ...baseLogItem,
        msg: 'fake message 2',
        inputLogFilter: { className: 'class2', tags: ['tag4'] },
        outputLogFilter,
      };

      const logMediator = getLogMediator();
      const result = logMediator.isFilteredLog(item1, outputLogFilter);
      expect(result).toBe(true);
    });
  });

  describe(`writeLogs()`, () => {
    const baseLogItem: LogItem = {
      moduleName: 'fakeName1',
      date: new Date(),
      outputLogFilter: {},
      outputLogLevel: 'info',
      inputLogLevel: 'info',
      inputLogFilter: {},
      logger: new ConsoleLogger(),
      msg: 'fake messge 1',
    };

    it(`inputLogLevel == outputLogLevel`, () => {
      const outputLogFilter = new OutputLogFilter();
      outputLogFilter.tags = ['tag4'];

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

    it(`inputLogLevel < outputLogLevel`, () => {
      const outputLogFilter = new OutputLogFilter();
      outputLogFilter.tags = ['tag4'];

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
