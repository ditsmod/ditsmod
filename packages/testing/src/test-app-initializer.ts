import { AppInitializer, NormalizedModuleMetadata, Provider } from '@ditsmod/core';

import { TestOverrider } from './test-overrider.js';
import { TestProvider } from './types.js';

export class TestAppInitializer extends AppInitializer {
  protected providersToOverride: TestProvider[] = [];
  protected providersPerApp: Provider[] = [];
  protected extensionsProviders: Provider[] = [];

  setExtensionProviders(extensionsProviders: Provider[]) {
    this.extensionsProviders.push(...extensionsProviders);
  }

  setProvidersPerApp(providersPerApp: Provider[]) {
    this.providersPerApp = providersPerApp;
  }

  overrideProviders(providers: TestProvider[]) {
    this.providersToOverride.push(...providers);
  }

  getProvidersToOverride() {
    return this.providersToOverride;
  }

  protected override patchMetaAfterStage1(meta: NormalizedModuleMetadata) {
    meta.providersPerApp.push(...this.providersPerApp);
    meta.extensionsProviders.push(...this.extensionsProviders);
    const providersToOverride = this.getProvidersToOverride();
    new TestOverrider().overrideAllProviders(this.perAppService, meta, providersToOverride);
    return meta;
  }
}
