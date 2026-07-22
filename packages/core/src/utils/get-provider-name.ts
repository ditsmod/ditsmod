import { resolveForwardRef } from '#di/forward-ref.js';
import { InjectionToken } from '#di/top/injection-token.js';
import { isNormalizedProvider } from '#di/utils.js';
import { getToken } from './get-tokens.js';

/**
 * Returns provider or token name.
 */
export function getProviderName(provider: any) {
  if (provider == null) {
    return `${provider}`;
  }

  provider = resolveForwardRef(provider);

  let token: any;
  if (isNormalizedProvider(provider) || provider instanceof Function) {
    token = getToken(provider);
  } else {
    if (provider instanceof InjectionToken) {
      token = provider;
    } else if (
      typeof provider == 'symbol' ||
      typeof provider == 'string' ||
      typeof provider == 'number' ||
      typeof provider == 'boolean'
    ) {
      token = provider;
    } else {
      token = provider.constructor instanceof Function ? provider.constructor : provider;
    }
  }

  token = resolveForwardRef(token);

  if (typeof token == 'symbol') {
    return token.description || token.toString();
  }

  return typeof token == 'function' ? token.name || `${token}` : `${token.name || token}`;
}
