import { isClassProvider, isFactoryProvider, isFunctionFactoryProvider, isTokenProvider, isValueProvider } from '#di';
import { Provider } from '#types/mix.js';
import { getTokens } from './get-tokens.js';

/**
 * If you have a replacement for some provider - you have a collision.
 *
 * Returns array of uniq tokens.
 *
 * @todo Add checks for FactoryProvider.
 */
export function getCollisions(uniqDuplTokens: any[], providers: Provider[]) {
  uniqDuplTokens ??= [];
  providers ??= [];
  const duplProviders: Provider[] = [];
  const duplTokens: any[] = [];
  const collisions = new Set<any>();

  getTokens(providers).forEach((token, i) => {
    if (uniqDuplTokens.includes(token)) {
      const currProvider = providers[i];
      const index = duplTokens.indexOf(token);
      if (index == -1) {
        duplTokens.push(token);
        duplProviders.push(currProvider);
      } else {
        const lastProvider = duplProviders[index];
        if (isClassProvider(lastProvider) && isClassProvider(currProvider)) {
          if (lastProvider.useClass !== currProvider.useClass) {
            collisions.add(token);
          }
        } else if (isValueProvider(lastProvider) && isValueProvider(currProvider)) {
          if (lastProvider.useValue !== currProvider.useValue) {
            collisions.add(token);
          }
        } else if (isTokenProvider(lastProvider) && isTokenProvider(currProvider)) {
          if (lastProvider.useToken !== currProvider.useToken) {
            collisions.add(token);
          }
        } else if (isFactoryProvider(lastProvider) && isFactoryProvider(currProvider)) {
          if (!isFunctionFactoryProvider(lastProvider) && !isFunctionFactoryProvider(currProvider)) {
            if (lastProvider.useFactory[1] !== currProvider.useFactory[1]) {
              collisions.add(token);
            }
          }
          if (isFunctionFactoryProvider(lastProvider) && isFunctionFactoryProvider(currProvider)) {
            if (lastProvider.useFactory !== currProvider.useFactory) {
              collisions.add(token);
            }
          }
        } else if (lastProvider !== currProvider) {
          collisions.add(token);
        }
      }
    }
  });

  return [...collisions];
}
