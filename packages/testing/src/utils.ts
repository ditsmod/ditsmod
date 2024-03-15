import { OutputLogLevel, LoggerConfig, Provider, ValueProvider, normalizeProviders } from '@ditsmod/core';

/**
 * Override only logLevel in existing `LoggerConfig`.
 */
export function overrideLogLevel(providers: Provider[], logLevel: OutputLogLevel) {
  const aNormProviders = normalizeProviders(providers);
  const tokens = aNormProviders.map((p) => p.token);
  const index = tokens.lastIndexOf(LoggerConfig);
  if (index != -1) {
    const oNormProvider = aNormProviders.at(index) as ValueProvider<LoggerConfig>;
    const useValue = { ...oNormProvider.useValue };
    useValue.level = logLevel;
    providers.push({ token: LoggerConfig, useValue });
  } else {
    const useValue: LoggerConfig = { level: logLevel };
    providers.push({ token: LoggerConfig, useValue });
  }
}
