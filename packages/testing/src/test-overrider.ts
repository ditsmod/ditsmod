import { normalizeProviders, Provider, PerAppService, Providers } from '@ditsmod/core';
import { Meta, Level } from './types.js';

export class TestOverrider {
  static overrideAllProviders(perAppService: PerAppService, metadata: Meta, providersToOverride: Provider[]) {
    providersToOverride.forEach((provider) => {
      const providersPerApp = perAppService.providers;
      this.overrideProvider(['App'], { providersPerApp }, provider);
    });

    perAppService.reinitInjector();

    providersToOverride.forEach((provider) => {
      this.overrideProvider(['Mod', 'Rou', 'Req'], metadata, provider);
    });
  }

  /**
   * If the token of the `provider` that needs to be overridden is found in the `metadata`,
   * that `provider` is added to the `metadata` array last in the same scope.
   */
  static overrideProvider(levels: Level[], metadata: Meta, provider: Provider) {
    levels.forEach((level) => {
      const providers = [...(metadata[`providersPer${level}`] || [])];
      const normExistingProviders = normalizeProviders(providers);
      const normProvider = normalizeProviders([provider])[0];
      if (normExistingProviders.some((p) => p.token === normProvider.token)) {
        if (metadata[`providersPer${level}`] instanceof Providers) {
          metadata[`providersPer${level}`] = [...(metadata[`providersPer${level}`] as Providers), provider];
        } else {
          (metadata[`providersPer${level}`] as Provider[]).push(provider);
        }
      }
    });
  }
}
