import { Provider, PerAppService, getToken, getTokens, resolveForwardRef } from '@ditsmod/core';
import { ProvidersOnly, Level } from './types.js';

export class TestOverrider {
  static overrideAllProviders(
    perAppService: PerAppService,
    providersOnly: ProvidersOnly,
    providersToOverride: Provider[],
  ) {
    providersToOverride.forEach((provider) => {
      const providersPerApp = perAppService.providers;
      const providersOnly = { providersPerApp };
      this.overrideProvider(['App'], providersOnly, provider);
      perAppService.providers = providersOnly.providersPerApp;
    });

    perAppService.reinitInjector();

    providersToOverride.forEach((provider) => {
      this.overrideProvider(['Mod', 'Rou', 'Req'], providersOnly, provider);
    });
  }

  /**
   * If the token of the {@link provider} that needs to be overridden is found in the {@link providersOnly},
   * that {@link provider} is added to the {@link providersOnly} array last in the same scope.
   */
  static overrideProvider(levels: Level[], providersOnly: ProvidersOnly, provider: Provider) {
    levels.forEach((level) => {
      const providers = [...(providersOnly[`providersPer${level}`] || [])].map(resolveForwardRef);
      const token = getToken(provider);
      if (getTokens(providers).some((t) => t === token)) {
        providers.push(provider);
        providersOnly[`providersPer${level}`] = providers;
      }
    });
  }
}
