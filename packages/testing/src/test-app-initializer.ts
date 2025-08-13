import {
  ExtensionCounters,
  ExtensionsContext,
  InternalExtensionsManager,
  MetadataPerMod2,
  ModRefId,
  Provider,
  Providers,
} from '@ditsmod/core';
import { RestAppInitializer } from '@ditsmod/rest';

import { TestOverrider } from './test-overrider.js';
import { ProvidersOnly, OverriderConfig, Level } from './types.js';
import { TestExtensionsManager } from './test-extensions-manager.js';
import { OVERRIDERS_CONFIG } from './constants.js';

export class TestAppInitializer extends RestAppInitializer {
  protected mAdditionalProviders = new Map<ModRefId, ProvidersOnly<Provider[]>>();
  protected providersForOverride: Provider[] = [];
  protected aOverriderConfig: OverriderConfig[] = [];

  setOverriderConfig(config: OverriderConfig) {
    this.aOverriderConfig.push(config);
  }

  addProvidersToModule(modRefId: ModRefId, providersOnly: ProvidersOnly) {
    const objWithProviders = this.mAdditionalProviders.get(modRefId) || new ProvidersOnly<Provider[]>();
    if (!this.mAdditionalProviders.has(modRefId)) {
      this.mAdditionalProviders.set(modRefId, objWithProviders);
    }
    (['App', 'Mod', 'Rou', 'Req'] satisfies Level[]).forEach((level) => {
      objWithProviders[`providersPer${level}`]!.push(...(providersOnly[`providersPer${level}`] || []));
    });
  }

  overrideModuleMeta(providers: Providers | Provider[]) {
    this.providersForOverride.push(...providers);
  }

  protected override overrideMetaAfterStage1<T extends ProvidersOnly>(modRefId: ModRefId, providersOnly: T) {
    const additionalProviders = this.mAdditionalProviders.get(modRefId);
    if (additionalProviders) {
      (['App', 'Mod', 'Rou', 'Req'] satisfies Level[]).forEach((level) => {
        const providersPerLevel = [...(providersOnly[`providersPer${level}`] || [])];
        providersPerLevel.push(...(additionalProviders[`providersPer${level}`] || []));
        providersOnly[`providersPer${level}`] = providersPerLevel;
      });
    }
    TestOverrider.overrideAllProviders(this.perAppService, providersOnly, this.providersForOverride);
    return providersOnly;
  }

  protected override getProvidersForExtensions(
    metadataPerMod2: MetadataPerMod2,
    extensionCounters: ExtensionCounters,
    extensionsContext: ExtensionsContext,
  ): Provider[] {
    const providers = super.getProvidersForExtensions(metadataPerMod2, extensionCounters, extensionsContext);
    providers.push(
      { token: InternalExtensionsManager, useClass: TestExtensionsManager },
      { token: OVERRIDERS_CONFIG, useValue: this.aOverriderConfig },
    );
    return providers;
  }
}
