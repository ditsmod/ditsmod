import 'reflect-metadata';
import { Provider, ReflectiveInjector } from '@ts-stack/di';
import { it, fit, jest, describe, fdescribe, beforeEach, expect, afterEach } from '@jest/globals';

import { LogItem, LogMediator, OutputLogFilter } from './log-mediator';
import { ModuleExtract } from '../models/module-extract';
import { ConsoleLogger } from '../services/console-logger';

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

    it(`works with relevant input and output log filters`, () => {
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
});
