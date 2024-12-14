import {
  AppInitializer,
  ExtensionCounters,
  ExtensionsContext,
  ExtensionsManager,
  MetadataPerMod2,
  NormalizedModuleMetadata,
  Provider,
  Providers,
} from '@ditsmod/core';

import { TestOverrider } from './test-overrider.js';
import { OverriderConfig, TestProvider } from './types.js';
import { TestExtensionsManager } from './test-extensions-manager.js';
import { OVERRIDERS_CONFIG } from './constants.js';

export class TestAppInitializer extends AppInitializer {
  protected providersToOverride: TestProvider[] = [];
  protected providersPerApp: Provider[] = [];
  protected aOverriderConfig: OverriderConfig[] = [];

  setOverriderConfig(config: OverriderConfig) {
    this.aOverriderConfig.push(config);
  }

  setProvidersPerApp(providersPerApp: Provider[]) {
    this.providersPerApp = providersPerApp;
  }

  overrideStatic(providers: Providers | TestProvider[]) {
    this.providersToOverride.push(...providers);
  }

  getProvidersToOverride() {
    return this.providersToOverride;
  }

  protected override overrideMetaAfterStage1(meta: NormalizedModuleMetadata) {
    meta.providersPerApp.push(...this.providersPerApp);
    const providersToOverride = this.getProvidersToOverride();
    new TestOverrider().overrideAllProviders(this.perAppService, meta, providersToOverride);
    return meta;
  }

  protected override getProvidersForExtensions(
    metadataPerMod2: MetadataPerMod2,
    extensionCounters: ExtensionCounters,
    extensionsContext: ExtensionsContext,
  ): Provider[] {
    const providers = super.getProvidersForExtensions(metadataPerMod2, extensionCounters, extensionsContext);
    providers.push(
      { token: ExtensionsManager, useClass: TestExtensionsManager },
      { token: OVERRIDERS_CONFIG, useValue: this.aOverriderConfig },
    );
    return providers;
  }
}
