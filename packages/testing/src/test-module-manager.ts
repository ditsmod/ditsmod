import {
  AppendsWithParams,
  ModuleManager,
  ModuleType,
  ModuleWithParams,
  NormalizedModuleMetadata,
  OutputLogLevel,
  ServiceProvider,
} from '@ditsmod/core';

import { TestProvider } from './types.js';

type AnyModule = ModuleType | ModuleWithParams | AppendsWithParams;

export class TestModuleManager extends ModuleManager {
  protected providersToOverride: TestProvider[] = [];
  protected logLevel: OutputLogLevel;
  protected providersPerApp: ServiceProvider[];
  protected extensionsProviders: ServiceProvider[];

  setProvidersPerApp(providersPerApp: ServiceProvider[]) {
    this.providersPerApp = providersPerApp;
  }

  setExtensionProviders(extensionsProviders: ServiceProvider[]) {
    this.extensionsProviders = extensionsProviders;
  }

  overrideProviders(providers: TestProvider[]) {
    this.providersToOverride = providers;
  }

  /**
   * This `logLevel` is set after the HTTP request handlers are installed.
   * It does not cover application initialization time.
   */
  setLogLevel(logLevel: OutputLogLevel) {
    this.logLevel = logLevel;
  }

  getLogLevel() {
    return this.logLevel || 'off';
  }

  getProvidersToOverride() {
    return this.providersToOverride;
  }

  protected override normalizeMetadata(mod: AnyModule): NormalizedModuleMetadata {
    const meta = super.normalizeMetadata(mod);
    meta.providersPerApp.push(...this.providersPerApp);
    meta.extensionsProviders.push(...this.extensionsProviders);
    return meta;
  }
}
