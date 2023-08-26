import { AppInitializer, LogLevel, MetadataPerMod1 } from '@ditsmod/core';

import { overrideLogLevel } from './utils.js';

export class TestAppInitializer extends AppInitializer {
  protected logLevel: LogLevel;

  protected override prepareMetadataPerMod1(metadataPerMod1: MetadataPerMod1) {
    overrideLogLevel(metadataPerMod1.meta.providersPerMod, this.logLevel);
    return metadataPerMod1;
  }

  /**
   * This setting of log level only works during initialization,
   * before HTTP request handlers are created.
   */
  setInitLogLevel(logLevel: LogLevel = 'off') {
    this.logLevel = logLevel;
  }
}
