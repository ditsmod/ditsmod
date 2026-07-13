import type { Provider } from '#di/top/types-and-models.js';
import { isClassProvider, isFactoryProvider, isTokenProvider, isValueProvider } from '#di/utils.js';
import { normalizeProviders } from './ng-utils.js';
import { isProvider } from './type-guards.js';

export function getToken(provider: Provider): any {
  return normalizeProviders([provider]).map((p) => {
    if (p.token) {
      return p.token;
    } else if (isFactoryProvider(p)) {
      if (Array.isArray(p.useFactory)) {
        return p.useFactory[1];
      } else {
        return p.useFactory;
      }
    }
  })[0];
}

export function getTokens<T = any>(providers: Provider[] | ReadonlyArray<Provider>): T[] {
  const tokens: T[] = [];
  (providers || []).forEach((item) => {
    if (isProvider(item)) {
      tokens.push(getToken(item));
    } else {
      tokens.push(item);
    }
  });

  return tokens;
}

/**
 * Extracts the implementation target (class, token, value, or factory) from a given DI provider.
 *
 * For example:
 * - If it's a `ClassProvider`, returns `provider.useClass`.
 * - If it's a `TokenProvider`, returns `provider.useToken`.
 * - If it's a `ValueProvider`, returns `provider.useValue`.
 * - If it's a `FactoryProvider`, returns `provider.useFactory`.
 * - Otherwise (if it's a `TypeProvider`), returns the `provider` itself.
 */
export function getProviderTarget(provider: Provider) {
  if (isClassProvider(provider)) {
    return provider.useClass;
  } else if (isTokenProvider(provider)) {
    return provider.useToken;
  } else if (isValueProvider(provider)) {
    return provider.useValue;
  } else if (isFactoryProvider(provider)) {
    return provider.useFactory;
  } else {
    return provider;
  }
}

/**
 * Extracts implementation targets from an array of DI providers.
 *
 * @see getProviderTarget
 */
export function getProvidersTargets(providers: Provider[]) {
  return providers.map(getProviderTarget);
}
