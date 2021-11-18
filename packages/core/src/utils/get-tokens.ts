import { ServiceProvider } from '../types/mix';
import { normalizeProviders } from './ng-utils';

export function getToken(provider: ServiceProvider): any {
  return normalizeProviders([provider]).map((p) => p.provide)[0];
}

export function getTokens(provider: ServiceProvider): any[];
export function getTokens(providers: ServiceProvider[] | ReadonlyArray<ServiceProvider>): any[];
export function getTokens(providerOrProviders: ServiceProvider | ServiceProvider[] | ReadonlyArray<ServiceProvider>): any[] {
  const arr = Array.isArray(providerOrProviders) ? providerOrProviders : [providerOrProviders] as ServiceProvider[];
  return normalizeProviders(arr).map((p) => p.provide);
}
