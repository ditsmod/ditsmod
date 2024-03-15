import { LoggerConfig, ValueProvider } from '@ditsmod/core';
import { overrideLogLevel } from './utils.js';

describe('overrideLogLevel', () => {
  it("push logger's config in empty array", () => {
    const providers: ValueProvider<LoggerConfig>[] = [];
    expect(() => overrideLogLevel(providers, 'all')).not.toThrow();
    const loggerConfig = new LoggerConfig('all');
    const provider: ValueProvider<LoggerConfig> = { token: LoggerConfig, useValue: loggerConfig };
    expect(providers.length).toBe(1);
    expect(providers[0]).toEqual(provider);
  });

  it("change logger's config for existing provider", () => {
    const loggerConfig: LoggerConfig & { other?: string } = { level: 'all', other: 'any' };
    const provider: ValueProvider = { token: LoggerConfig, useValue: loggerConfig };
    const providers: ValueProvider<LoggerConfig & { other?: string }>[] = [provider];
    overrideLogLevel(providers, 'info');
    expect(providers.length).toBe(2);
    expect(providers[0]).toBe(provider);
    expect(providers[1]).not.toBe(provider);
    expect(providers[1].useValue.level).toBe('info');
    expect(providers[1].useValue.other).toBe('any');
  });

  it("change logger's config only for last provider", () => {
    const loggerConfig1 = new LoggerConfig('all');
    const loggerConfig2 = new LoggerConfig('debug');
    const provider1: ValueProvider = { token: LoggerConfig, useValue: loggerConfig1 };
    const provider2: ValueProvider = { token: LoggerConfig, useValue: loggerConfig2 };
    const providers: ValueProvider<LoggerConfig>[] = [provider1, provider2];
    overrideLogLevel(providers, 'info');
    expect(providers.length).toBe(3);
    expect(providers[0]).toBe(provider1);
    expect(providers[0].useValue.level).toBe('all');
    expect(providers[1]).toBe(provider2);
    expect(providers[1].useValue.level).toBe('debug');
    expect(providers[2]).not.toBe(provider1);
    expect(providers[2]).not.toBe(provider2);
    expect(providers[2].useValue.level).toBe('info');
  });
});
