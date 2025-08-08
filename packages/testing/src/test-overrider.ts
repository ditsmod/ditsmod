import { Provider, PerAppService, getToken, getTokens } from '@ditsmod/core';
import { ProvidersOnly, Level } from './types.js';

export class TestOverrider {
  static overrideAllProviders(
    perAppService: PerAppService,
    providersOnly: ProvidersOnly,
    providersToOverride: Provider[],
  ) {
    providersToOverride.forEach((provider) => {
      const providersPerApp = perAppService.providers;
      this.overrideProvider(['App'], { providersPerApp }, provider);
    });

    perAppService.reinitInjector();

    providersToOverride.forEach((provider) => {
      this.overrideProvider(['Mod', 'Rou', 'Req'], providersOnly, provider);
    });
  }

  /**
   * If the token of the `provider` that needs to be overridden is found in the `providersOnly`,
   * that `provider` is added to the `providersOnly` array last in the same scope.
   */
  static overrideProvider(levels: Level[], providersOnly: ProvidersOnly, provider: Provider) {
    levels.forEach((level) => {
      const providers = [...(providersOnly[`providersPer${level}`] || [])];
      const token = getToken(provider);
      if (getTokens(providers).some((t) => t === token)) {
        providers.push(provider);
        providersOnly[`providersPer${level}`] = providers;
      }
    });
  }
}
