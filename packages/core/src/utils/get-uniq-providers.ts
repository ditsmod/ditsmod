import { ServiceProvider } from '../types/mix';
import { NormalizedProvider, normalizeProviders } from './ng-utils';
import { isClassProvider, isExistingProvider, isFactoryProvider, isValueProvider } from './type-guards';

/**
 * Returns last provider if the provider has the duplicate.
 * For the multi providers, removes duplicates only with identical `provide`
 * and `useValue`, `useClass`, `useExisting` or `useFactory`.
 */
export function getUniqProviders<T extends ServiceProvider = ServiceProvider>(providers: T[]) {
  const tokens = normalizeProviders(providers).map((np) => np.provide);
  const uniqProviders: T[] = [];

  tokens.forEach((currToken, currIndex) => {
    const provider = providers[currIndex];
    const isMultiProvider = (provider as NormalizedProvider).multi;
    if (isMultiProvider) {
      let hasDuplicate = true;
      for (const uniqProvider of uniqProviders) {
        if ((provider as NormalizedProvider).provide !== (uniqProvider as NormalizedProvider).provide) {
          // ok, this is uniq provider
        } else if (isValueProvider(uniqProvider) && isValueProvider(provider)) {
          if (uniqProvider.useValue === provider.useValue) {
            continue;
          }
        } else if (isClassProvider(uniqProvider) && isClassProvider(provider)) {
          if (uniqProvider.useClass === provider.useClass) {
            continue;
          }
        } else if (isExistingProvider(uniqProvider) && isExistingProvider(provider)) {
          if (uniqProvider.useExisting === provider.useExisting) {
            continue;
          }
        } else if (isFactoryProvider(uniqProvider) && isFactoryProvider(provider)) {
          if (uniqProvider.useFactory === provider.useFactory) {
            continue;
          }
        }
        hasDuplicate = false;
      }
      if (!uniqProviders.length || !hasDuplicate) {
        uniqProviders.push(provider);
      }
    } else if (tokens.lastIndexOf(currToken) == currIndex) {
      uniqProviders.push(provider);
    }
  });

  return uniqProviders;
}
