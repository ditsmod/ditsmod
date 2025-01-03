import { isClassProvider, isFactoryProvider, isTokenProvider, isValueProvider } from '#di';
import { Provider } from '#types/mix.js';
import { normalizeProviders } from './ng-utils.js';
import { isProvider } from './type-guards.js';

export function getToken(provider: Provider): any {
  return normalizeProviders([provider]).map((p) => p.token)[0];
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

export function getProvidersTargets(providers: Provider[]) {
  return providers.map(getProviderTarget);
}
