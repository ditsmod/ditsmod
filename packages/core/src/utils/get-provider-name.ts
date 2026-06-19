import { InjectionToken } from '#di/top/injection-token.js';
import { Class } from '#di/top/types-and-models.js';
import { isNormalizedProvider } from '#di/utils.js';
import { getToken } from './get-tokens.js';

/**
 * Returns provider or token name.
 */
export function getProviderName(provider: any) {
  let token: any;
  if (isNormalizedProvider(provider) || provider instanceof Function) {
    token = getToken(provider);
  } else {
    if (provider instanceof InjectionToken) {
      token = provider;
    } else {
      if (typeof provider == 'string') {
        token = provider;
      } else {
        token = provider.constructor instanceof Function ? provider.constructor : provider;
      }
    }
  }
  return typeof token == 'symbol' ? token.toString() : `${token.name || token}`;
}
