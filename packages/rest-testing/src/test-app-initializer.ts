import type {
  NormalizedModuleMeta,
  ExtensionCounters,
  ExtensionContext,
  ForwardRefFn,
  ResolvedModuleMetadata,
  ModRefId,
  Provider,
  ProviderBuilder,
} from '@ditsmod/core';
import { InternalExtensionManager, resolveForwardRef } from '@ditsmod/core';
import { RestAppInitializer } from '@ditsmod/rest';

import { TestOverrider } from './test-overrider.js';
import type { OverriderConfig } from './types.js';
import { TestExtensionManager } from './test-extension-manager.js';
import { OVERRIDERS_CONFIG } from './constants.js';

export class TestAppInitializer extends RestAppInitializer {
  protected mAdditionalProviders = new Map<ModRefId, Provider[]>();
  protected providersForOverride: Provider[] = [];
  protected aOverriderConfig: OverriderConfig[] = [];

  setOverriderConfig(config: OverriderConfig) {
    this.aOverriderConfig.push(config);
  }

  addProvidersToModule(modRefId: ModRefId, rawProviders: ProviderBuilder | (Provider | ForwardRefFn<Provider>)[]) {
    const aProviders = this.mAdditionalProviders.get(modRefId) || [];
    if (!this.mAdditionalProviders.has(modRefId)) {
      this.mAdditionalProviders.set(modRefId, aProviders);
    }
    const normalizedProviders = [...rawProviders].map(resolveForwardRef);
    aProviders.push(...normalizedProviders);
  }

  overrideModuleMeta(rawProviders: ProviderBuilder | (Provider | ForwardRefFn<Provider>)[]) {
    const providers = [...rawProviders].map(resolveForwardRef);
    this.providersForOverride.push(...providers);
  }

  protected override overrideMetaAfterStage1(modRefId: ModRefId, normalizedModuleMeta: NormalizedModuleMeta) {
    const additionalProviders = this.mAdditionalProviders.get(modRefId);
    this.addAndOverrideProviders([normalizedModuleMeta.providersPerApp, normalizedModuleMeta.providersPerMod], additionalProviders);
    normalizedModuleMeta.mInitHooks.forEach((initHooks, decorator) => {
      const meta = normalizedModuleMeta.initMeta.get(decorator);
      if (meta) {
        this.addAndOverrideProviders(initHooks.getProvidersToOverride(meta), additionalProviders);
      }
    });
    return normalizedModuleMeta;
  }

  protected addAndOverrideProviders(aProviders: Provider[][], additionalProviders?: Provider[]) {
    if (additionalProviders) {
      aProviders.forEach((arr) => arr.push(...additionalProviders));
    }
    TestOverrider.overrideAllProviders(this.normalizedModuleMeta.providersPerApp, aProviders, this.providersForOverride);
  }

  protected override getProvidersForExtensions(
    resolvedModuleMetadata: ResolvedModuleMetadata,
    extensionCounters: ExtensionCounters,
    extensionContext: ExtensionContext,
  ): Provider[] {
    const providers = super.getProvidersForExtensions(resolvedModuleMetadata, extensionCounters, extensionContext);
    providers.push(
      { token: InternalExtensionManager, useClass: TestExtensionManager },
      { token: OVERRIDERS_CONFIG, useValue: this.aOverriderConfig },
    );
    return providers;
  }
}
