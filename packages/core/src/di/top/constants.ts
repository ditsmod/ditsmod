import { getSymbol } from '#di/top/get-symbol.js';
import type { DecoratorAndValue } from './decorator-and-value.js';
import { InjectionToken } from './injection-token.js';
import type { DepsMeta } from './resolved-provider.js';

/**
 * The key used to store metadata of a class.
 * This metadata is taken from the parameter-level decorator in a constructor of a class.
 */
export const PARAM_KEY = new InjectionToken<(DecoratorAndValue[] | null)[]>('PARAM_KEY');
/**
 * The key used to store cached dependencies of a class.
 * This dependencies is seted by `injector.getDependencies()`.
 */
export const DEPS_KEY = getSymbol<DepsMeta>('DEPS_KEY');
