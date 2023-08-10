import {
  AppInitializer,
  LogLevel,
  LoggerConfig,
  MetadataPerMod1,
  Providers,
  ValueProvider,
  normalizeProviders,
} from '@ditsmod/core';

export class TestAppInitializer extends AppInitializer {
  protected logLevel: LogLevel;

  protected override prepareMetadataPerMod1(metadataPerMod1: MetadataPerMod1) {
    if (this.logLevel) {
      // Trying to override only logLevel in existing LoggerConfig.

      const normProviders = normalizeProviders(metadataPerMod1.meta.providersPerMod);
      const tokens = normProviders.map((p) => p.token);
      const index = tokens.lastIndexOf(LoggerConfig);
      if (index != 1) {
        const provider = normProviders.at(index) as ValueProvider<LoggerConfig>;
        const useValue = { ...provider.useValue };
        useValue.level = this.logLevel;
        metadataPerMod1.meta.providersPerMod.push({ token: LoggerConfig, useValue });
      } else {
        metadataPerMod1.meta.providersPerMod.push(...new Providers().useLogConfig({ level: this.logLevel }));
      }
    }
    return metadataPerMod1;
  }

  /**
   * This setting of log level only works during initialization,
   * before HTTP request handlers are created.
   */
  setLogLevelForInit(logLevel: LogLevel) {
    this.logLevel = logLevel;
  }
}
