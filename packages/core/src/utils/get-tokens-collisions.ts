import { format } from 'util';

import { ServiceProvider } from '../types/mix';
import { getTokens } from './get-tokens';
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

  getTokens(providers).forEach((token, i) => {
    if (uniqDuplTokens.includes(token)) {
      duplProviders.push(providers[i]);
    }
  });

  const normDuplProviders = normalizeProviders(duplProviders);

  return uniqDuplTokens.filter((dulpToken): boolean | void => {
    let prevProvider: ServiceProvider;

    for (let i = 0; i < normDuplProviders.length; i++) {
      if (normDuplProviders[i].provide !== dulpToken) {
        continue;
      }

      const currProvider = duplProviders[i];
      if (!prevProvider!) {
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
