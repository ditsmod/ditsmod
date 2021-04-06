import { ServiceProvider } from '../types/mix';
import { normalizeProviders } from './ng-utils';

/**
 * Returns last provider if the provider has the duplicate.
 */
export function getUniqProviders<T extends ServiceProvider = ServiceProvider>(providers: T[]) {
  const tokens = normalizeProviders(providers).map((np) => np.provide);
  const uniqProviders: T[] = [];

  tokens.forEach((currToken, currIndex) => {
    if (tokens.lastIndexOf(currToken) == currIndex) {
      uniqProviders.push(providers[currIndex]);
    }
  });

  return uniqProviders;
}
