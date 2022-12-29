import { Class } from '@ts-stack/di';
import { getToken } from './get-tokens';
import { isNormalizedProvider } from './type-guards';

/**
 * Returns provider or token name.
 */
export function getProviderName(provider: any) {
  let token: any;
  if (isNormalizedProvider(provider) || provider instanceof Class) {
    token = getToken(provider);
  } else {
    token = provider;
  }
  const tokenName = `${token.name || token}`;
  return tokenName.replace('InjectionToken ', '');
}
