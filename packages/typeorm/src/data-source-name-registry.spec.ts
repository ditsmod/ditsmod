import { jest } from '@jest/globals';

import { DataSourceNameRegistry } from './data-source-name-registry.js';

describe('DataSourceNameRegistry', () => {
  beforeEach(() => {
    DataSourceNameRegistry.clear();
  });

  it('should register a name without warning on first call', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    DataSourceNameRegistry.register('default');

    expect(consoleSpy).not.toHaveBeenCalled();
    expect(DataSourceNameRegistry.has('default')).toBe(true);

    consoleSpy.mockRestore();
  });

  it('should warn via console.warn when a name is registered twice', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    DataSourceNameRegistry.register('default');
    DataSourceNameRegistry.register('default');

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"default"'));

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
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    DataSourceNameRegistry.register('default');
    DataSourceNameRegistry.unregister('default');
    DataSourceNameRegistry.register('default');

    expect(consoleSpy).not.toHaveBeenCalled();
    expect(DataSourceNameRegistry.has('default')).toBe(true);

    consoleSpy.mockRestore();
  });

  it('should clear all names', () => {
    DataSourceNameRegistry.register('default');
    DataSourceNameRegistry.register('analytics');
    DataSourceNameRegistry.clear();

    expect(DataSourceNameRegistry.has('default')).toBe(false);
    expect(DataSourceNameRegistry.has('analytics')).toBe(false);
  });
});
