import { Provider } from '#types/mix.js';
import { getTokens } from './get-tokens.js';
import { isMultiProvider } from '#di';

/**
 * Returns last provider if the provider has the duplicate.
 * Multi providers returns untouched.
 */
export function getLastProviders<T extends Provider = Provider>(providers: T[]) {
  const tokens = getTokens(providers);
  const uniqProviders: T[] = [];

  tokens.forEach((token, i) => {
    const provider = providers[i];
    if (isMultiProvider(provider)) {
      uniqProviders.push(provider);
    } else if (tokens.lastIndexOf(token) == i) {
      uniqProviders.push(provider);
    }
  });

  return uniqProviders;
}
