import { LogLevel, ModuleType, NormalizedProvider } from '@ditsmod/core';

import { PreTestApplication } from './pre-test-application';

// This class is only needed as a wrapper over the PreTestApplication
// class to hide the bootstrap() method from the public API.
export class TestApplication {
  protected preTestApplication: PreTestApplication;

  constructor(appModule: ModuleType) {
    this.preTestApplication = new PreTestApplication(appModule);
  }

  /**
   * Overrides providers at any level if there are matching providers at those levels
   * (they have the same tokens). Therefore, unlike the `setProvidersPerApp()` method,
   * this method does not always add providers to the DI.
   * 
   * In most cases, this is the method you need.
   */
  overrideProviders(providers: NormalizedProvider[]) {
    this.preTestApplication.overrideProviders(providers);
    return this;
  }

  /**
   * Adds providers at the application level. This method is intended, for example,
   * to set the level of logs during testing, etc.
   * 
   * If you need to _override_ a specific provider at the application level,
   * you should use the `overrideProviders()` method instead.
   */
  setProvidersPerApp(providers: NormalizedProvider[]) {
    this.preTestApplication.setProvidersPerApp(providers);
    return this;
  }

  /**
   * This setting of log level only works during initialization,
   * before HTTP request handlers are created.
   */
  setLogLevelForInit(logLevel: LogLevel) {
    this.preTestApplication.setLogLevelForInit(logLevel);
    return this;
  }

  getServer(listen: boolean = false) {
    return this.preTestApplication.getServer(listen);
  }
}
