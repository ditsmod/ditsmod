import { ServiceProvider } from '../types/mix';
import { normalizeProviders } from './ng-utils';
import { isClassProvider, isExistingProvider, isFactoryProvider, isProvider, isValueProvider } from './type-guards';

export function getToken(provider: ServiceProvider): any {
  return normalizeProviders([provider]).map((p) => p.token)[0];
}

export function getTokens(providers: ServiceProvider[] | ReadonlyArray<ServiceProvider>): any[] {
  const tokens: any[] = [];
  (providers || []).forEach((item) => {
    if (isProvider(item)) {
      tokens.push(getToken(item));
    } else {
      tokens.push(item);
    }
  });

  return tokens;
}

export function getProviderTarget(provider: ServiceProvider) {
  if (isClassProvider(provider)) {
    return provider.useClass;
  } else if (isExistingProvider(provider)) {
    return provider.useToken;
  } else if (isValueProvider(provider)) {
    return provider.useValue;
  } else if (isFactoryProvider(provider)) {
    return provider.useFactory;
  } else {
    return provider;
  }
}

export function getProvidersTargets(providers: ServiceProvider[]) {
  return providers.map(getProviderTarget);
}
