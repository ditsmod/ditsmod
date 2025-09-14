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

export interface DecoratorWithGuard<T extends AnyFn, Value> {
  /**
   * Class decorator factory.
   */
  (...args: Parameters<T>): any;
  /**
   * Type guard.
   */
  appliedTo(arg: DecoratorAndValue): arg is DecoratorAndValue<Value>;
}

/**
 * @param transform Such a transformer should not use symbols that can be wrapped with `forwardRef()`,
 * because at this stage the `resolveForwardRef()` function will not work correctly.
 * @param decoratorId If you pass an argument for this parameter, {@link transform} must
 * return data of the same or extended type as the {@link decoratorId} you specified.
 * @param debugFactoryName Gives a name to the decorator that can be viewed during debugging.
 */
export function makeClassDecorator<T extends AnyFn, Value>(
  transform?: T,
  decoratorId?: DecoratorWithGuard<T, Value>,
  debugFactoryName?: string,
): DecoratorWithGuard<T, Value> {
  function classDecoratorFactory(...args: Parameters<T>): any {
    const value = transform ? transform(...args) : ([...args] as Value);
    const declaredInDir = CallsiteUtils.getCallerDir(classDecoratorFactory.name);
    return function classDecorator(Cls: Class): void {
      const annotations: any[] = getRawMetadata(Cls, CLASS_KEY, []);
      const decoratorAndValue = new DecoratorAndValue(decoratorId || classDecoratorFactory, value, declaredInDir);
      annotations.push(decoratorAndValue);
    };
  }
  classDecoratorFactory.appliedTo = function appliedTo<T>(arg: DecoratorAndValue): arg is DecoratorAndValue<T> {
    return arg.decorator === (decoratorId || classDecoratorFactory);
  };
  if (debugFactoryName) {
    Object.defineProperty(classDecoratorFactory, 'name', { value: debugFactoryName });
  }
  return classDecoratorFactory;
}

/**
 * @param transform Such a transformer should not use symbols that can be wrapped with `forwardRef()`,
 * because at this stage the `resolveForwardRef()` function will not work correctly.
 * @param decoratorId If you pass an argument for this parameter, {@link transform} must
 * return data of the same or extended type as the {@link decoratorId} you specified.
 * @param debugFactoryName Gives a name to the decorator that can be viewed during debugging.
 */
export function makeParamDecorator<T extends AnyFn, Value>(
  transform?: T,
  decoratorId?: DecoratorWithGuard<T, Value>,
  debugFactoryName?: string,
): DecoratorWithGuard<T, Value> {
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

      (parameters[index] ??= []).push(new DecoratorAndValue(decoratorId || paramDecorFactory, value));
    };
  }
  paramDecorFactory.appliedTo = function appliedTo<T>(arg: DecoratorAndValue): arg is DecoratorAndValue<T> {
    return arg.decorator === (decoratorId || paramDecorFactory);
  };
  if (paramDecorFactory) {
    Object.defineProperty(paramDecorFactory, 'name', { value: debugFactoryName });
  }
  return paramDecorFactory;
}

/**
 * @param transform Such a transformer should not use symbols that can be wrapped with `forwardRef()`,
 * because at this stage the `resolveForwardRef()` function will not work correctly.
 * @param decoratorId If you pass an argument for this parameter, {@link transform} must
 * return data of the same or extended type as the {@link decoratorId} you specified.
 * @param debugFactoryName Gives a name to the decorator that can be viewed during debugging.
 */
export function makePropDecorator<T extends AnyFn, Value>(
  transform?: T,
  decoratorId?: DecoratorWithGuard<T, Value>,
  debugFactoryName?: string,
): DecoratorWithGuard<T, Value> {
  function propDecorFactory(...args: Parameters<T>) {
    const value = transform ? transform(...args) : [...args];
    return function propDecorator(target: any, propertyKey: string | symbol): void {
      const Cls = target.constructor as Class;
      const meta = getRawMetadata(Cls, PROP_KEY, {} as { [key: string | symbol]: any });
      meta[propertyKey] = (meta.hasOwnProperty(propertyKey) && meta[propertyKey]) || [];
      meta[propertyKey].push(new DecoratorAndValue(decoratorId || propDecorFactory, value));
    };
  }
  propDecorFactory.appliedTo = function appliedTo<T>(arg: DecoratorAndValue): arg is DecoratorAndValue<T> {
    return arg.decorator === (decoratorId || propDecorFactory);
  };
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
