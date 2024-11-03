import { AppInitializer, OutputLogLevel, NormalizedModuleMetadata } from '@ditsmod/core';
import { overrideLogLevel } from './utils.js';

export class TestAppInitializer extends AppInitializer {
  protected logLevel: OutputLogLevel;

  protected override prepareMetadataPerMod1(meta: NormalizedModuleMetadata) {
    overrideLogLevel(meta.providersPerMod, this.logLevel);
    return meta;
  }

  /**
   * This setting of log level only works during initialization,
   * before HTTP request handlers are created.
   */
  setInitLogLevel(logLevel: OutputLogLevel = 'off') {
    this.logLevel = logLevel;
  }
}
