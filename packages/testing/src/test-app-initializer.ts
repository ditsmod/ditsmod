import {
  ExtensionCounters,
  ExtensionsContext,
  InternalExtensionsManager,
  MetadataPerMod2,
  ModRefId,
  BaseMeta,
  Provider,
  Providers,
} from '@ditsmod/core';
import { AppInitializer, initRest } from '@ditsmod/rest';

import { TestOverrider } from './test-overrider.js';
import { ProvidersOnly, OverriderConfig, Level } from './types.js';
import { TestExtensionsManager } from './test-extensions-manager.js';
import { OVERRIDERS_CONFIG } from './constants.js';

export class TestAppInitializer extends AppInitializer {
  protected providersMetaForAdding = new Map<ModRefId, ProvidersOnly<Provider[]>>();
  protected providersToOverride: Provider[] = [];
  protected aOverriderConfig: OverriderConfig[] = [];

  setOverriderConfig(config: OverriderConfig) {
    this.aOverriderConfig.push(config);
  }

  addProvidersToModule(modRefId: ModRefId, providersMeta: ProvidersOnly) {
    const existingProvidersMeta = this.providersMetaForAdding.get(modRefId);
    const levels: Level[] = ['App', 'Mod', 'Rou', 'Req'];
    levels.forEach((level) => {
      const providers = [...(providersMeta[`providersPer${level}`] || [])];
      if (existingProvidersMeta) {
        existingProvidersMeta[`providersPer${level}`]!.push(...providers);
      } else {
        providersMeta[`providersPer${level}`] = providers;
        this.providersMetaForAdding.set(modRefId, providersMeta as ProvidersOnly<Provider[]>);
      }
    });
  }

  overrideModuleMeta(providers: Providers | Provider[]) {
    this.providersToOverride.push(...providers);
  }

  protected override overrideMetaAfterStage1(baseMeta: BaseMeta) {
    const providersMeta = this.providersMetaForAdding.get(baseMeta.modRefId);
    if (providersMeta) {
      (['App', 'Mod', 'Rou', 'Req'] satisfies Level[]).forEach((level) => {
        const meta = baseMeta.initMeta.get(initRest)!;
        meta[`providersPer${level}`].push(...providersMeta[`providersPer${level}`]!);
        if (level == 'App' || level == 'Mod') {
          baseMeta[`providersPer${level}`].push(...providersMeta[`providersPer${level}`]!);
        }
      });
    }
    TestOverrider.overrideAllProviders(this.perAppService, baseMeta, this.providersToOverride);
    return baseMeta;
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
