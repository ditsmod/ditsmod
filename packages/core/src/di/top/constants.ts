/**
 * The key used to store metadata of a class.
 * This metadata is taken from the class-level decorator.
 */
export const CLASS_KEY = Symbol();
/**
 * The key used to store metadata of a class.
 * This metadata is taken from the parameter-level decorator in a constructor of a class.
 */
export const PARAMS_KEY = Symbol();
/**
 * The key used to store metadata of a class.
 * This metadata is taken from the property-level decorator of a class.
 */
export const PROP_KEY = Symbol();
/**
 * The key used to store cached metadata of a class.
 * This metadata is taken from all decorators of a class.
 */
export const CACHE_KEY = Symbol();
/**
 * The key used to store cached dependencies of a class.
 * This dependencies is seted by `injector.getDependencies()`.
 */
export const DEPS_KEY = Symbol();
/**
 * The key used to store registry of props where are params with metadata.
 */
export const METHODS_WITH_PARAMS = Symbol();
