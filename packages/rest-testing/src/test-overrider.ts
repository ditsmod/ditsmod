import { Provider, PerAppService, getToken, getTokens } from '@ditsmod/core';

export class TestOverrider {
  static overrideAllProviders(perAppService: PerAppService, aProviders: Provider[][], providersToOverride: Provider[]) {
    providersToOverride.forEach((provider) => {
      this.overrideProvider([perAppService.providers], provider);
    });

    perAppService.reinitInjector();

    providersToOverride.forEach((provider) => {
      this.overrideProvider(aProviders, provider);
    });
  }

  /**
   * If the token of the {@link provider} that needs to be overridden is found in the {@link providersOnly},
   * that {@link provider} is added to the {@link providersOnly} array last in the same scope.
   */
  static overrideProvider(aProviders: Provider[][], provider: Provider) {
    aProviders.forEach((providers) => {
      const token = getToken(provider);
      if (getTokens(providers).some((t) => t === token)) {
        providers.push(provider);
      }
    });
  }
}
