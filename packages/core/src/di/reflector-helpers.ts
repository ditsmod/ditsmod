import type { AnyObj } from '#types/mix.js';
import type { DecoratorAndValue } from './top/decorator-and-value.js';
import type { AbstractClass, Class, ClassMeta } from './top/types-and-models.js';
import { WeakMap26 } from './shim/weak-map-26.js';

export function getMethodParamMeta(
  Cls: Class | AbstractClass,
  propertyKey: string | symbol,
): undefined | (DecoratorAndValue<any>[] | null)[];
export function getMethodParamMeta(
  Cls: Class | AbstractClass,
  propertyKey: string | symbol,
  defaultValue: any[],
): (DecoratorAndValue<any>[] | null)[];
export function getMethodParamMeta(Cls: Class | AbstractClass, propertyKey: string | symbol, defaultValue?: any[]) {
  const map = methodParamsMap.getOrInsert(Cls, new Map());
  if (defaultValue && !map.has(propertyKey)) {
    map.set(propertyKey, defaultValue);
  }
  return map.get(propertyKey);
}

export const mergedClassMetaCache = new WeakMap<Class, ClassMeta | undefined>();
export const classMetaChainCache = new WeakMap<Class, ClassMetaChain | undefined>();

export const classMetaMap = new WeakMap26<Class | AbstractClass, DecoratorAndValue[]>();
export const propMetaMap = new WeakMap26<Class | AbstractClass, Record<string | symbol, DecoratorAndValue[]>>();
export const methodWithParamsMap = new WeakMap26<Class | AbstractClass, Set<string | symbol>>();
export const constructorParamsMap = new WeakMap26<Class | AbstractClass, (DecoratorAndValue<any>[] | null)[]>();
export const methodParamsMap = new WeakMap26<
  Class | AbstractClass,
  Map<string | symbol, (DecoratorAndValue<any>[] | null)[]>
>();

export type ClassMetaChain<DecorValue = any, Proto extends AnyObj = AnyObj> = Map<
  Class,
  ClassMeta<DecorValue, Proto> | undefined
>;
export type KeyOfClass<Proto extends AnyObj> = keyof Proto | 'constructor' | symbol | (string & {});
/**
 * Attention: These regex has to hold even if the code is minified!
 */
const DELEGATE_CTOR = /^function\s+\S+\(\)\s*{[\s\S]+\.apply\(this,\s*arguments\)/;
const INHERITED_CLASS = /^class\s+[A-Za-z\d$_]*\s*extends\s+[^{]+{/;
const INHERITED_CLASS_WITH_CTOR = /^class\s+[A-Za-z\d$_]*\s*extends\s+[^{]+{[\s\S]*constructor\s*\(/;
const INHERITED_CLASS_WITH_DELEGATE_CTOR =
  /^class\s+[A-Za-z\d$_]*\s*extends\s+[^{]+{[\s\S]*constructor\s*\(\)\s*{\s+super\(\.\.\.arguments\)/;

/**
 * Determine whether a stringified type is a class which delegates its constructor
 * to its parent.
 *
 * This is not trivial since compiled code can actually contain a constructor function
 * even if the original source code did not. For instance, when the child class contains
 * an initialized instance property.
 */
export function isDelegateCtor(typeStr: string): boolean {
  return (
    DELEGATE_CTOR.test(typeStr) ||
    INHERITED_CLASS_WITH_DELEGATE_CTOR.test(typeStr) ||
    (INHERITED_CLASS.test(typeStr) && !INHERITED_CLASS_WITH_CTOR.test(typeStr))
  );
}
