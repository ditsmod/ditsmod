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
  protected aOverriderConfig: OverriderConfig[] = [];

  setOverriderConfig(config: OverriderConfig) {
    this.aOverriderConfig.push(config);
  }

  overrideStatic(providers: Providers | TestProvider[]) {
    this.providersToOverride.push(...providers);
  }

  protected override overrideMetaAfterStage1(meta: NormalizedModuleMetadata) {
    new TestOverrider().overrideAllProviders(this.perAppService, meta, this.providersToOverride);
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
