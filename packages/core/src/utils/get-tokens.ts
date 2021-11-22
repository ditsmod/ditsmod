import { ServiceProvider } from '../types/mix';
import { normalizeProviders } from './ng-utils';
import { isProvider } from './type-guards';

export function getToken(provider: ServiceProvider): any {
  return normalizeProviders([provider]).map((p) => p.provide)[0];
}

export function getTokens(providerOrToken: any): any[];
export function getTokens(providersOrTokens: any[] | ReadonlyArray<any>): any[];
export function getTokens(
  providerOrProviders: ServiceProvider | ServiceProvider[] | ReadonlyArray<ServiceProvider>
): any[] {
  const arr = Array.isArray(providerOrProviders) ? providerOrProviders : ([providerOrProviders] as ServiceProvider[]);
  const tokens: any[] = [];
  arr.forEach((item) => {
    if (isProvider(item)) {
      tokens.push(getToken(item));
    } else {
      tokens.push(item);
    }
  });

  return tokens;
}
