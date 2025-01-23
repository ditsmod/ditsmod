import {
  AppInitializer,
  ExtensionCounters,
  ExtensionsContext,
  InternalExtensionsManager,
  MetadataPerMod2,
  ModRefId,
  NormalizedMeta,
  Provider,
  Providers,
} from '@ditsmod/core';

import { TestOverrider } from './test-overrider.js';
import { Meta, OverriderConfig, Level } from './types.js';
import { TestExtensionsManager } from './test-extensions-manager.js';
import { OVERRIDERS_CONFIG } from './constants.js';

export class TestAppInitializer extends AppInitializer {
  protected providersMetaForAdding = new Map<ModRefId, Meta<Provider[]>>();
  protected providersToOverride: Provider[] = [];
  protected aOverriderConfig: OverriderConfig[] = [];

  setOverriderConfig(config: OverriderConfig) {
    this.aOverriderConfig.push(config);
  }

  addProvidersToModule(modRefId: ModRefId, providersMeta: Meta) {
    const existingProvidersMeta = this.providersMetaForAdding.get(modRefId);
    const levels: Level[] = ['App', 'Mod', 'Rou', 'Req'];
    if (existingProvidersMeta) {
      levels.forEach((level) => {
        const providers = [...(providersMeta[`providersPer${level}`] || [])];
        existingProvidersMeta[`providersPer${level}`]!.push(...providers);
      });
    } else {
      levels.forEach((level) => {
        const providers = [...(providersMeta[`providersPer${level}`] || [])];
        providersMeta[`providersPer${level}`] = providers;
      });
      this.providersMetaForAdding.set(modRefId, providersMeta as Meta<Provider[]>);
    }
  }

  overrideModuleMeta(providers: Providers | Provider[]) {
    this.providersToOverride.push(...providers);
  }

  protected override overrideMetaAfterStage1(meta: NormalizedMeta) {
    const providersMeta = this.providersMetaForAdding.get(meta.modRefId);
    if (providersMeta) {
      (['App', 'Mod', 'Rou', 'Req'] satisfies Level[]).forEach((level) => {
        meta[`providersPer${level}`].push(...providersMeta[`providersPer${level}`]!);
      });
    }
    TestOverrider.overrideAllProviders(this.perAppService, meta, this.providersToOverride);
    return meta;
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
