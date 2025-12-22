import { Class, InjectionToken, isNormalizedProvider } from '#di';
import { getToken } from './get-tokens.js';

/**
 * Returns provider or token name.
 */
export function getProviderName(provider: any) {
  let token: any;
  if (isNormalizedProvider(provider) || provider instanceof Class) {
    token = getToken(provider);
  } else {
    if (provider instanceof InjectionToken) {
      token = provider;
    } else {
      if (typeof provider == 'string') {
        token = provider;
      } else {
        token = provider.constructor instanceof Class ? provider.constructor : provider;
      }
    }
  }
  return typeof token == 'symbol' ? token.toString() : `${token.name || token}`;
}
