import type { Provider } from '@ditsmod/core';
import { getToken, getTokens } from '@ditsmod/core';

export class TestOverrider {
  static overrideAllProviders(providersPerApp: Provider[], providerArrays: Provider[][], providersToOverride: Provider[]) {
    providersToOverride.forEach((provider) => {
      this.overrideProvider([providersPerApp], provider);
    });

    providersToOverride.forEach((provider) => {
      this.overrideProvider(providerArrays, provider);
    });
  }

  /**
   * If the token of the `provider` that needs to be overridden is found in the `providerArrays`,
   * that `provider` is added to the `providerArrays` array last in the same scope.
   */
  static overrideProvider(providerArrays: Provider[][], provider: Provider) {
    providerArrays.forEach((providers) => {
      const token = getToken(provider);
      if (getTokens(providers).some((t) => t === token)) {
        providers.push(provider);
      }
    });
  }
}
