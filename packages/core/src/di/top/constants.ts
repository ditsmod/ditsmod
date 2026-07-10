import { createInjectionSymbol } from '#di/top/get-symbol.js';
import type { DepsMeta } from './resolved-provider.js';

/**
 * The key used to store cached dependencies of a class.
 * This dependencies is seted by `injector.getDependencies()`.
 */
export const DEPS_KEY = createInjectionSymbol<DepsMeta>('DEPS_KEY');
