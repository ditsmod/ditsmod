import { ModRefId, ModuleManager, NormalizedModuleMetadata, OutputLogLevel, Provider } from '@ditsmod/core';
import { TestProvider } from './types.js';

export class TestModuleManager extends ModuleManager {
  protected providersToOverride: TestProvider[] = [];
  protected logLevel: OutputLogLevel;
  protected providersPerApp: Provider[];
  protected extensionsProviders: Provider[];

  setProvidersPerApp(providersPerApp: Provider[]) {
    this.providersPerApp = providersPerApp;
  }

  setExtensionProviders(extensionsProviders: Provider[]) {
    this.extensionsProviders = extensionsProviders;
  }

  overrideProviders(providers: TestProvider[]) {
    this.providersToOverride = providers;
  }

  /**
   * This log level is set after the HTTP request handlers are installed.
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

  protected override normalizeMetadata(modRefId: ModRefId): NormalizedModuleMetadata {
    const meta = super.normalizeMetadata(modRefId);
    meta.providersPerApp.push(...this.providersPerApp);
    meta.extensionsProviders.push(...this.extensionsProviders);
    return meta;
  }
}
