import { ServiceProvider } from '../types/mix';
import { getTokens } from './get-tokens';
import { isMultiProvider } from './type-guards';

/**
 * Returns last provider if the provider has the duplicate.
 * For the multi providers, removes duplicates only with identical `provide`
 * and `useValue`, `useClass`, `useExisting` or `useFactory`.
 */
export function getUniqProviders<T extends ServiceProvider = ServiceProvider>(providers: T[]) {
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
