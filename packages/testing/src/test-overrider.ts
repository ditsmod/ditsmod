import type { Provider, PerAppService} from '@ditsmod/core';
import { getToken, getTokens } from '@ditsmod/core';

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
   * If the token of the `provider` that needs to be overridden is found in the `aProviders`,
   * that `provider` is added to the `aProviders` array last in the same scope.
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
