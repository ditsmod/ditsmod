import { Type } from '@ts-stack/di';
import { ServiceProvider } from '../types/mix';
import { getToken } from './get-tokens';
import { isNormalizedProvider } from './type-guards';

/**
 * Returns provider or token name.
 */
export function getProviderName(provider: ServiceProvider) {
  let token: any;
  if (isNormalizedProvider(provider) || provider instanceof Type) {
    token = getToken(provider);
  } else {
    token = provider;
  }
  const tokenName = `${token.name || token}`;
  return tokenName.replace('InjectionToken ', '');
}
