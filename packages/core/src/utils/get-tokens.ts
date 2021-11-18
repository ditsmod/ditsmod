import { ServiceProvider } from '../types/mix';
import { normalizeProviders } from './ng-utils';

export function getToken(provider: ServiceProvider): any {
  return normalizeProviders([provider]).map((p) => p.provide)[0];
}

export function getTokens(provider: ServiceProvider): any[];
export function getTokens(providers: ServiceProvider[]): any[];
export function getTokens(providerOrProviders: ServiceProvider | ServiceProvider[]): any[] {
  providerOrProviders = Array.isArray(providerOrProviders) ? providerOrProviders : [providerOrProviders];
  return normalizeProviders(providerOrProviders).map((p) => p.provide);
}
