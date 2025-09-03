import { ModRefId } from '#types/mix.js';
import { InjectionToken } from './injection-token.js';
import {
  Class,
  ClassFactoryProvider,
  ClassProvider,
  DecoratorAndValue,
  FactoryProvider,
  FunctionFactoryProvider,
  NormalizedProvider,
  Provider,
  TokenProvider,
  TypeProvider,
  ValueProvider,
} from './types-and-models.js';

/**
 * Equivalent to ES6 spread, add each item to an array.
 *
 * @param items The items to add
 * @param arr The array to which you want to add the items
 */
export function addAllToArray(items: any[], arr: any[]) {
  for (let i = 0; i < items.length; i++) {
    arr.push(items[i]);
  }
}

/**
 * Flattens an array.
 */
export function flatten(list: any[], dst?: any[]): any[] {
  if (dst === undefined) {
    dst = list;
  }
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (Array.isArray(item)) {
      // we need to inline it.
      if (dst === list) {
        // Our assumption that the list was already flat was wrong and
        // we need to clone flat since we need to write to it.
        dst = list.slice(0, i);
      }
      flatten(item, dst);
    } else if (dst !== list) {
      dst.push(item);
    }
  }
  return dst;
}

export function deepForEach<T>(input: (T | any[])[], fn: (value: T) => void): void {
  input.forEach((value) => (Array.isArray(value) ? deepForEach(value, fn) : fn(value)));
}

export function addToArray(arr: any[], index: number, value: any): void {
  // perf: array.push is faster than array.splice!
  if (index >= arr.length) {
    arr.push(value);
  } else {
    arr.splice(index, 0, value);
  }
}

export function removeFromArray(arr: any[], index: number): any {
  // perf: array.pop is faster than array.splice!
  if (index >= arr.length - 1) {
    return arr.pop();
  } else {
    return arr.splice(index, 1)[0];
  }
}

export function newArray<T = any>(size: number): T[];
export function newArray<T>(size: number, value: T): T[];
export function newArray<T>(size: number, value?: T): T[] {
  const list: T[] = [];
  for (let i = 0; i < size; i++) {
    list.push(value!);
  }
  return list;
}

export function isDecoratorAndValue(
  decoratorAndValue?: DecoratorAndValue | Class,
): decoratorAndValue is DecoratorAndValue {
  return (
    (decoratorAndValue as DecoratorAndValue)?.decorator !== undefined &&
    Boolean(decoratorAndValue?.hasOwnProperty('value'))
  );
}

export function isType(v: any): v is Class {
  return typeof v == 'function';
}

export function isTypeProvider(provider: Provider): provider is TypeProvider {
  return provider instanceof Class;
}

export function isValueProvider(provider?: Provider | ModRefId): provider is ValueProvider {
  return (
    provider?.hasOwnProperty('useValue') ||
    (Boolean(provider?.hasOwnProperty('token')) &&
      !provider?.hasOwnProperty('useClass') &&
      !provider?.hasOwnProperty('useToken') &&
      !provider?.hasOwnProperty('useFactory'))
  );
}

export function isClassProvider(provider?: Provider | ModRefId): provider is ClassProvider {
  return (provider as ClassProvider)?.useClass !== undefined;
}
export function isTokenProvider(provider?: Provider | ModRefId): provider is TokenProvider {
  return (provider as TokenProvider)?.useToken !== undefined;
}

export function isFactoryProvider(provider?: Provider | ModRefId): provider is FactoryProvider {
  return (provider as FactoryProvider)?.useFactory !== undefined;
}

export function isInjectionToken(token?: any): token is InjectionToken<any> {
  return token instanceof InjectionToken;
}

export function isClassFactoryProvider(provider?: Provider): provider is ClassFactoryProvider {
  return Array.isArray((provider as ClassFactoryProvider)?.useFactory);
}

export function isFunctionFactoryProvider(provider: Provider): provider is FunctionFactoryProvider {
  return typeof (provider as FactoryProvider)?.useFactory == 'function';
}

export type MultiProvider = Exclude<Provider, TypeProvider> & { multi: boolean };

export function isMultiProvider(provider?: Provider): provider is MultiProvider {
  return (
    (provider as ValueProvider)?.multi === true &&
    (isValueProvider(provider) || isClassProvider(provider) || isTokenProvider(provider) || isFactoryProvider(provider))
  );
}

/**
 * Returns true if providers declares in format:
 * ```ts
 * { token: SomeClas, useClass: OtherClass }
 * ```
 */
export function isNormalizedProvider(provider?: Provider | ModRefId): provider is NormalizedProvider {
  return (
    isValueProvider(provider) || isClassProvider(provider) || isTokenProvider(provider) || isFactoryProvider(provider)
  );
}
