import { getCallerDir } from '#utils/callsites.js';
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

export function makeClassDecorator<T extends (...args: any[]) => any>(transform?: T) {
  return function classDecorFactory(...args: Parameters<T>): any {
    const value = transform ? transform(...args) : [...args];
    const declaredInDir = getCallerDir();
    return function classDecorator(Cls: Class): void {
      const annotations: any[] = getMetadata(Cls, CLASS_KEY, []);
      const decoratorAndValue = new DecoratorAndValue(classDecorFactory, value, declaredInDir);
      annotations.push(decoratorAndValue);
    };
  };
}

export function makeParamDecorator<T extends (...args: any[]) => any>(transform?: T) {
  return function paramDecorFactory(...args: Parameters<T>) {
    const value = transform ? transform(...args) : [...args];
    return function paramDecorator(
      clsOrObj: Class | object,
      propertyKey: string | symbol | undefined,
      index: number,
    ): void {
      // This function can be called for a class constructor and methods.
      const Cls = isType(clsOrObj) ? clsOrObj : (clsOrObj.constructor as Class);
      const key = getParamKey(PARAMS_KEY, propertyKey);
      const parameters: any[] = getMetadata(Cls, key, []);

      // There might be gaps if some in between parameters do not have annotations.
      // we pad with nulls.
      while (parameters.length <= index) {
        parameters.push(null);
      }

      (parameters[index] = parameters[index] || []).push(new DecoratorAndValue(paramDecorFactory, value));
    };
  };
}

export function makePropDecorator<T extends (...args: any[]) => any>(transform?: T) {
  return function propDecorFactory(...args: Parameters<T>) {
    const value = transform ? transform(...args) : [...args];
    return function propDecorator(target: any, propertyKey: string | symbol): void {
      const Cls = target.constructor as Class;
      const meta = getMetadata(Cls, PROP_KEY, {});
      meta[propertyKey] = (meta.hasOwnProperty(propertyKey) && meta[propertyKey]) || [];
      meta[propertyKey].unshift(new DecoratorAndValue(propDecorFactory, value));
    };
  };
}

export function getParamKey(defaultKey: symbol, propertyKey?: string | symbol): symbol {
  if (propertyKey) {
    return typeof propertyKey == 'symbol' ? propertyKey : Symbol.for(`ɵ${propertyKey}`);
  } else {
    return defaultKey;
  }
}

function getMetadata(Cls: Class, key: symbol, defaultValue: any) {
  // Use of Object.defineProperty is important since it creates non-enumerable property which
  // prevents the property is copied during subclassing.
  return Cls.hasOwnProperty(key)
    ? Cls[key as keyof Class]
    : Object.defineProperty(Cls, key, { value: defaultValue })[key as keyof Class];
}
