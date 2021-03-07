import { format } from 'util';

import { ServiceProvider } from '../types/service-provider';
import { normalizeProviders } from './ng-utils';
import { isNormalizedProvider } from './type-guards';

/**
 * Returns array of uniq tokens.
 *
 * If you have a replacement for some provider - you have a collision.
 */
export function getTokensCollisions(uniqDuplTokens: any[], providers: ServiceProvider[]) {
  uniqDuplTokens = uniqDuplTokens || [];
  providers = providers || [];
  const duplProviders: ServiceProvider[] = [];

  normalizeProviders(providers)
    .map((np) => np.provide)
    .forEach((currToken, currIndex) => {
      if (uniqDuplTokens.includes(currToken)) {
        duplProviders.push(providers[currIndex]);
      }
    });

  const normDuplProviders = normalizeProviders(duplProviders);

  return uniqDuplTokens.filter((dulpToken) => {
    let prevProvider: ServiceProvider;

    for (let i = 0; i < normDuplProviders.length; i++) {
      if (normDuplProviders[i].provide !== dulpToken) {
        continue;
      }

      const currProvider = duplProviders[i];
      if (!prevProvider) {
        prevProvider = currProvider;
      }

      if (isNormalizedProvider(prevProvider) && isNormalizedProvider(currProvider)) {
        if (prevProvider.provide !== currProvider.provide || format(prevProvider) != format(currProvider)) {
          return true;
        }
        continue;
      } else if (prevProvider !== currProvider) {
        return true;
      }
    }
  });
}
