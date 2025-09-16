import { AnyFn } from '#types/mix.js';
import { CallsiteUtils } from '#utils/callsites.js';
import { DecoratorAndValue, type Class } from './types-and-models.js';
import { isType } from './utils.js';

/**
 * The key used to store metadata in a static property of a class.
 * This metadata is taken from the class-level decorator.
 */
export const CLASS_KEY = Symbol();
/**
 * The key used to store metadata in a static property of a class.
 * This metadata is taken from the parameter-level decorator in a constructor of a class.
 */
export const PARAMS_KEY = Symbol();
/**
 * The key used to store metadata in a static property of a class.
 * This metadata is taken from the property-level decorator of a class.
 */
export const PROP_KEY = Symbol();
/**
 * The key used to store cached metadata in a static property of a class.
 * This metadata is taken from all decorators of a class.
 */
export const CACHE_KEY = Symbol();
/**
 * The key used to store cached dependencies in a static property of a class.
 * This dependencies is seted by `injector.getDependencies()`.
 */
export const DEPS_KEY = Symbol();
/**
 * The key used to store registry of props where are params with metadata.
 */
export const METHODS_WITH_PARAMS = Symbol();

/**
 * @param transform Such a transformer should not use symbols that can be wrapped with `forwardRef()`,
 * because at this stage the `resolveForwardRef()` function will not work correctly.
 * @param debugFactoryName Gives a name to the decorator that can be viewed during debugging.
 */
export function makeClassDecorator<T extends AnyFn>(transform?: T, debugFactoryName?: string) {
  function classDecoratorFactory(...args: Parameters<T>): any {
    const value = transform ? transform(...args) : [...args];
    const declaredInDir = CallsiteUtils.getCallerDir(classDecoratorFactory.name);
    return function classDecorator(Cls: Class): void {
      const annotations: any[] = getRawMetadata(Cls, CLASS_KEY, []);
      const decoratorAndValue = new DecoratorAndValue(classDecoratorFactory, value, declaredInDir);
      annotations.push(decoratorAndValue);
    };
  }
  if (debugFactoryName) {
    Object.defineProperty(classDecoratorFactory, 'name', { value: debugFactoryName });
  }
  return classDecoratorFactory;
}

/**
 * @param transform Such a transformer should not use symbols that can be wrapped with `forwardRef()`,
 * because at this stage the `resolveForwardRef()` function will not work correctly.
 * @param debugFactoryName Gives a name to the decorator that can be viewed during debugging.
 */
export function makeParamDecorator<T extends AnyFn>(transform?: T, debugFactoryName?: string) {
  function paramDecorFactory(...args: Parameters<T>) {
    const value = transform ? transform(...args) : [...args];
    return function paramDecorator(
      clsOrObj: Class | object,
      propertyKey: string | symbol | undefined,
      index: number,
    ): void {
      // This function can be called for a class constructor and methods.
      const Cls = isType(clsOrObj) ? clsOrObj : (clsOrObj.constructor as Class);
      const key = getParamKey(PARAMS_KEY, propertyKey);
      const parameters: any[] = getRawMetadata(Cls, key, []);
      const methodNames: Set<string | symbol> = getRawMetadata(Cls, METHODS_WITH_PARAMS, new Set());
      methodNames.add(propertyKey || 'constructor');

      // There might be gaps if some in between parameters do not have annotations.
      // we pad with nulls.
      while (parameters.length <= index) {
        parameters.push(null);
      }

      (parameters[index] ??= []).push(new DecoratorAndValue(paramDecorFactory, value));
    };
  }
  if (paramDecorFactory) {
    Object.defineProperty(paramDecorFactory, 'name', { value: debugFactoryName });
  }
  return paramDecorFactory;
}

/**
 * @param transform Such a transformer should not use symbols that can be wrapped with `forwardRef()`,
 * because at this stage the `resolveForwardRef()` function will not work correctly.
 * @param debugFactoryName Gives a name to the decorator that can be viewed during debugging.
 */
export function makePropDecorator<T extends AnyFn>(transform?: T, debugFactoryName?: string) {
  function propDecorFactory(...args: Parameters<T>) {
    const value = transform ? transform(...args) : [...args];
    return function propDecorator(target: any, propertyKey: string | symbol): void {
      const Cls = target.constructor as Class;
      const meta = getRawMetadata(Cls, PROP_KEY, {} as { [key: string | symbol]: any });
      meta[propertyKey] = (meta.hasOwnProperty(propertyKey) && meta[propertyKey]) || [];
      meta[propertyKey].push(new DecoratorAndValue(propDecorFactory, value));
    };
  }
  if (propDecorFactory) {
    Object.defineProperty(propDecorFactory, 'name', { value: debugFactoryName });
  }
  return propDecorFactory;
}

export function getParamKey(defaultKey: symbol, propertyKey?: string | symbol): symbol {
  if (propertyKey) {
    return typeof propertyKey == 'symbol' ? propertyKey : Symbol.for(`ɵ${propertyKey}`);
  } else {
    return defaultKey;
  }
}

export function getRawMetadata<T = any>(Cls: Class, key: symbol, defaultValue: T): T {
  // Use of Object.defineProperty is important since it creates non-enumerable property which
  // prevents the property is copied during subclassing.
  return Cls.hasOwnProperty(key)
    ? Cls[key as keyof Class]
    : Object.defineProperty(Cls, key, { value: defaultValue })[key as keyof Class];
}
