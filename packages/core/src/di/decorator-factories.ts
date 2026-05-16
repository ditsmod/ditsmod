import { AnyFn } from '#types/mix.js';
import { CallsiteUtils } from '#utils/callsites.js';
import { Reflector } from './reflector.js';
import {
  CLASS_KEY,
  DecoratorAndValue,
  METHODS_WITH_PARAMS,
  PARAMS_KEY,
  PROP_KEY,
  type Class,
} from './types-and-models.js';
import { isType } from './utils.js';

/**
 * @param transform Such a transformer should not use symbols that can be wrapped with `forwardRef()`,
 * because at this stage the `resolveForwardRef()` function will not work correctly.
 * @param debugFactoryName Gives a name to the decorator that can be viewed during debugging.
 * @param decoratorId Sometimes it is not enough to identify the metadata returned by a specific decorator
 * using `instanceof`. Sometimes it is useful to have a single identifier for a certain group of decorators.
 */
export function makeClassDecorator<T extends AnyFn>(transform?: T, debugFactoryName?: string, decoratorId?: AnyFn) {
  function classDecoratorFactory(...args: Parameters<T>): any {
    const value = transform ? transform(...args) : [...args];
    const declaredInDir = CallsiteUtils.getCallerDir();
    return function classDecorator(Cls: Class): void {
      const annotations = Reflector.getRawMeta(Cls, CLASS_KEY, undefined, [] as DecoratorAndValue[]);
      const decoratorAndValue = new DecoratorAndValue(decoratorId || classDecoratorFactory, value, declaredInDir);
      annotations.push(decoratorAndValue);
    };
  }
  setDecoratorFactoryName(classDecoratorFactory, debugFactoryName);
  return classDecoratorFactory;
}

/**
 * @param transform Such a transformer should not use symbols that can be wrapped with `forwardRef()`,
 * because at this stage the `resolveForwardRef()` function will not work correctly.
 * @param debugFactoryName Gives a name to the decorator that can be viewed during debugging.
 * @param decoratorId Sometimes it is not enough to identify the metadata returned by a specific decorator
 * using `instanceof`. Sometimes it is useful to have a single identifier for a certain group of decorators.
 */
export function makeParamDecorator<T extends AnyFn>(transform?: T, debugFactoryName?: string, decoratorId?: AnyFn) {
  function paramDecorFactory(...args: Parameters<T>) {
    const value = transform ? transform(...args) : [...args];
    return function paramDecorator(
      clsOrObj: Class | object,
      propertyKey: string | symbol | undefined,
      index: number,
    ): void {
      // This function can be called for a class constructor and methods.
      const Cls = isType(clsOrObj) ? clsOrObj : (clsOrObj.constructor as Class);
      const parameters = Reflector.getRawMeta(Cls, PARAMS_KEY, propertyKey, [] as any[]);
      const methodNames: Set<string | symbol> = Reflector.getRawMeta(Cls, METHODS_WITH_PARAMS, undefined, new Set());
      methodNames.add(propertyKey || 'constructor');

      // There might be gaps if some in between parameters do not have annotations.
      // we pad with nulls.
      while (parameters.length <= index) {
        parameters.push(null);
      }

      (parameters[index] ??= []).push(new DecoratorAndValue(decoratorId || paramDecorFactory, value));
    };
  }
  setDecoratorFactoryName(paramDecorFactory, debugFactoryName);
  return paramDecorFactory;
}

/**
 * @param transform Such a transformer should not use symbols that can be wrapped with `forwardRef()`,
 * because at this stage the `resolveForwardRef()` function will not work correctly.
 * @param debugFactoryName Gives a name to the decorator that can be viewed during debugging.
 * @param decoratorId Sometimes it is not enough to identify the metadata returned by a specific decorator
 * using `instanceof`. Sometimes it is useful to have a single identifier for a certain group of decorators.
 */
export function makePropDecorator<T extends AnyFn>(transform?: T, debugFactoryName?: string, decoratorId?: AnyFn) {
  function propDecorFactory(...args: Parameters<T>) {
    const value = transform ? transform(...args) : [...args];
    return function propDecorator(target: any, propertyKey: string | symbol): void {
      const Cls = target.constructor as Class;
      const defaultValue = {} as Record<string | symbol, DecoratorAndValue[]>;
      const meta = Reflector.getRawMeta(Cls, PROP_KEY, undefined, defaultValue);
      (meta[propertyKey] ??= []).push(new DecoratorAndValue(decoratorId || propDecorFactory, value));
    };
  }
  setDecoratorFactoryName(propDecorFactory, debugFactoryName);
  return propDecorFactory;
}

function setDecoratorFactoryName(factory: AnyFn, debugFactoryName?: string) {
  if (debugFactoryName) {
    Object.defineProperty(factory, 'name', { value: debugFactoryName });
  }
}
