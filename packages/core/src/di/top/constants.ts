import { getSymbol } from '#di/top/get-symbol.js';
import type { DecoratorAndValue } from './decorator-and-value.js';
import { InjectionToken } from './injection-token.js';
import type { DepsMeta } from './resolved-provider.js';

/**
 * The key used to store metadata of a class.
 * This metadata is taken from the class-level decorator.
 */
export const CLASS_KEY = new InjectionToken<DecoratorAndValue[]>('CLASS_KEY');
/**
 * The key used to store metadata of a class.
 * This metadata is taken from the parameter-level decorator in a constructor of a class.
 */
export const PARAMS_KEY = new InjectionToken<(DecoratorAndValue[] | null)[]>('PARAMS_KEY');
/**
 * The key used to store metadata of a class.
 * This metadata is taken from the property-level decorator of a class.
 */
export const PROP_KEY = new InjectionToken<Record<string | symbol, DecoratorAndValue[]>>('PROP_KEY');
/**
 * The key used to store registry of props where are params with metadata.
 */
export const METHODS_WITH_PARAMS = new InjectionToken<Set<string | symbol>>('METHODS_WITH_PARAMS');
/**
 * The key used to store cached dependencies of a class.
 * This dependencies is seted by `injector.getDependencies()`.
 */
export const DEPS_KEY = getSymbol<DepsMeta>('DEPS_KEY');
