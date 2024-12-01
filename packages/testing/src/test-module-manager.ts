import { ModRefId, ModuleManager, NormalizedModuleMetadata, Provider } from '@ditsmod/core';
import { TestProvider } from './types.js';

export class TestModuleManager extends ModuleManager {
  protected providersToOverride: TestProvider[] = [];
  protected providersPerApp: Provider[] = [];
  protected extensionsProviders: Provider[] = [];

  setProvidersPerApp(providersPerApp: Provider[]) {
    this.providersPerApp = providersPerApp;
  }

  setExtensionProviders(extensionsProviders: Provider[]) {
    this.extensionsProviders.push(...extensionsProviders);
  }

  overrideProviders(providers: TestProvider[]) {
    this.providersToOverride.push(...providers);
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
