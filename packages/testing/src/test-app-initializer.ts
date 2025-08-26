import {
  BaseMeta,
  ExtensionCounters,
  ExtensionsContext,
  ForwardRefFn,
  InternalExtensionsManager,
  MetadataPerMod2,
  ModRefId,
  Provider,
  Providers,
  resolveForwardRef,
} from '@ditsmod/core';
import { RestAppInitializer } from '@ditsmod/rest';

import { TestOverrider } from './test-overrider.js';
import { OverriderConfig } from './types.js';
import { TestExtensionsManager } from './test-extensions-manager.js';
import { OVERRIDERS_CONFIG } from './constants.js';

export class TestAppInitializer extends RestAppInitializer {
  protected mAdditionalProviders = new Map<ModRefId, Provider[]>();
  protected providersForOverride: Provider[] = [];
  protected aOverriderConfig: OverriderConfig[] = [];

  setOverriderConfig(config: OverriderConfig) {
    this.aOverriderConfig.push(config);
  }

  addProvidersToModule(modRefId: ModRefId, rawProviders: Providers | (Provider | ForwardRefFn<Provider>)[]) {
    const aProviders = this.mAdditionalProviders.get(modRefId) || [];
    if (!this.mAdditionalProviders.has(modRefId)) {
      this.mAdditionalProviders.set(modRefId, aProviders);
    }
    const normalizedProviders = [...rawProviders].map(resolveForwardRef);
    aProviders.push(...normalizedProviders);
  }

  overrideModuleMeta(rawProviders: Providers | (Provider | ForwardRefFn<Provider>)[]) {
    const providers = [...rawProviders].map(resolveForwardRef);
    this.providersForOverride.push(...providers);
  }

  protected override overrideMetaAfterStage1(modRefId: ModRefId, baseMeta: BaseMeta) {
    const additionalProviders = this.mAdditionalProviders.get(modRefId);
    this.addAndOverrideProviders([baseMeta.providersPerApp, baseMeta.providersPerMod], additionalProviders);
    baseMeta.mInitHooks.forEach((initHooks, decorator) => {
      const meta = baseMeta.initMeta.get(decorator);
      if (meta) {
        this.addAndOverrideProviders(initHooks.getProvidersToOverride(meta), additionalProviders);
      }
    });
    return baseMeta;
  }

  protected addAndOverrideProviders(aProviders: Provider[][], additionalProviders?: Provider[]) {
    if (additionalProviders) {
      aProviders.forEach((arr) => arr.push(...additionalProviders));
    }
    TestOverrider.overrideAllProviders(this.perAppService, aProviders, this.providersForOverride);
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
