import { Class } from '#di';
import { getToken } from './get-tokens.js';
import { isNormalizedProvider } from './type-guards.js';

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
  return `${token.name || token}`;
}
