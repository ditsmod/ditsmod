import { InjectionToken } from './injection-token.js';

/**
 * The key used to store metadata of a class.
 * This metadata is taken from the class-level decorator.
 */
export const CLASS_KEY = new InjectionToken('CLASS_KEY');
/**
 * The key used to store metadata of a class.
 * This metadata is taken from the parameter-level decorator in a constructor of a class.
 */
export const PARAMS_KEY = new InjectionToken('PARAMS_KEY');
/**
 * The key used to store metadata of a class.
 * This metadata is taken from the property-level decorator of a class.
 */
export const PROP_KEY = new InjectionToken('PROP_KEY');
/**
 * The key used to store cached metadata of a class.
 * This metadata is taken from all decorators of a class.
 */
export const CACHE_KEY = new InjectionToken('CACHE_KEY');
/**
 * The key used to store registry of props where are params with metadata.
 */
export const METHODS_WITH_PARAMS = new InjectionToken('METHODS_WITH_PARAMS');
/**
 * The key used to store cached dependencies of a class.
 * This dependencies is seted by `injector.getDependencies()`.
 */
export const DEPS_KEY = Symbol();
