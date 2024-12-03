import {
  normalizeProviders,
  isClassProvider,
  isFactoryProvider,
  getDependencies,
  Provider,
  PerAppService,
} from '@ditsmod/core';

import { Meta, Scope, TestClassProvider, TestFactoryProvider, TestProvider } from './types.js';

export class TestOverrider {
  overrideAllProviders(perAppService: PerAppService, metadata: Meta, providersToOverride: Provider[]) {
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
  protected overrideProvider(scopes: Scope[], metadata: Meta, provider: TestProvider) {
    scopes.forEach((scope) => {
      const normExistingProviders = normalizeProviders(metadata[`providersPer${scope}`] || []);
      const normProvider = normalizeProviders([provider])[0];
      if (normExistingProviders.some((p) => p.token === normProvider.token)) {
        metadata[`providersPer${scope}`]!.push(provider);
        if (isClassProvider(provider) || isFactoryProvider(provider)) {
          const allowedDeps = this.getAllowedDeps(provider);
          metadata[`providersPer${scope}`]!.push(...allowedDeps);
        }
      }
    });
  }

  /**
   * We don't want to blindly add all the providers that are in the `provider.providers` property,
   * as this can lead to unwanted results. We first need to check if the current provider depends
   * on the prepared providers, and if it does, then only add them at the same scope.
   */
  protected getAllowedDeps(provider: TestClassProvider | TestFactoryProvider) {
    const tokensOfDeps = getDependencies(provider).map((reflectiveDependecy) => reflectiveDependecy.token);
    const allowedDeps: Provider[] = [];

    (provider.providers || []).forEach((preparedProvider) => {
      const { token } = normalizeProviders([preparedProvider])[0];
      if (tokensOfDeps.includes(token)) {
        allowedDeps.push(preparedProvider);
      }
    });

    return allowedDeps;
  }
}
