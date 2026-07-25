import { jest } from '@jest/globals';
import type { Logger } from '@ditsmod/core';

import { DataSourceNameRegistry } from './data-source-name-registry.js';

describe('DataSourceNameRegistry', () => {
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(() => {
    DataSourceNameRegistry.clear();
    loggerMock = { log: jest.fn() } as any;
  });

  it('should register a name without warning on first call', () => {
    DataSourceNameRegistry.setLogger(loggerMock);
    DataSourceNameRegistry.register('default');

    expect(loggerMock.log).not.toHaveBeenCalled();
    expect(DataSourceNameRegistry.has('default')).toBe(true);
  });

  it('should warn via logger when a name is registered twice', () => {
    DataSourceNameRegistry.setLogger(loggerMock);
    DataSourceNameRegistry.register('default');
    DataSourceNameRegistry.register('default');

    expect(loggerMock.log).toHaveBeenCalledTimes(1);
    expect(loggerMock.log).toHaveBeenCalledWith('warn', expect.stringContaining('"default"'));
  });

  it('should warn via console.warn when no logger is attached', () => {
    // Remove logger to test the pre-DI fallback
    DataSourceNameRegistry.setLogger(undefined as any);
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    DataSourceNameRegistry.register('analytics');
    DataSourceNameRegistry.register('analytics');

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"analytics"'));
    consoleSpy.mockRestore();
  });

  it('should track multiple distinct names independently', () => {
    DataSourceNameRegistry.register('default');
    DataSourceNameRegistry.register('analytics');

    expect(DataSourceNameRegistry.has('default')).toBe(true);
    expect(DataSourceNameRegistry.has('analytics')).toBe(true);
    expect(DataSourceNameRegistry.has('reporting')).toBe(false);
  });

  it('should unregister a name so it can be re-registered cleanly', () => {
    DataSourceNameRegistry.setLogger(loggerMock);
    DataSourceNameRegistry.register('default');
    DataSourceNameRegistry.unregister('default');
    DataSourceNameRegistry.register('default');

    expect(loggerMock.log).not.toHaveBeenCalled();
    expect(DataSourceNameRegistry.has('default')).toBe(true);
  });

  it('should clear all names', () => {
    DataSourceNameRegistry.register('default');
    DataSourceNameRegistry.register('analytics');
    DataSourceNameRegistry.clear();

    expect(DataSourceNameRegistry.has('default')).toBe(false);
    expect(DataSourceNameRegistry.has('analytics')).toBe(false);
  });
});
