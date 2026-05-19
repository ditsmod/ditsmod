import type { AnyObj } from '#types/mix.js';
import type { AnyFn } from './common/types-and-models.js';
import { CallsiteUtils } from '#utils/callsites.js';
import { ClassMetaIterator } from './class-meta-iterator.js';
import { type ForwardRefFn, resolveForwardRef } from './forward-ref.js';
import {
  Class,
  type ParamsMeta,
  type ClassMeta,
  type ClassPropMeta,
  type TypeGuard,
  UnknownType,
} from './common/types-and-models.js';
import { DecoratorAndValue } from './common/decorator-and-value.js';
import { CACHE_KEY, CLASS_KEY, DEPS_KEY, PARAMS_KEY, METHODS_WITH_PARAMS, PROP_KEY } from './common/constants.js';
import { isType, newArray } from './utils.js';

type KeyOf<T extends AnyObj> = Extract<keyof T, string | symbol>;
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

export class Reflector {
  /**
   * @param transform Such a transformer should not use symbols that can be wrapped with `forwardRef()`,
   * because at this stage the `resolveForwardRef()` function will not work correctly.
   * @param debugFactoryName Gives a name to the decorator that can be viewed during debugging.
   * @param decoratorId Sometimes it is not enough to identify the metadata returned by a specific decorator
   * using `instanceof`. Sometimes it is useful to have a single identifier for a certain group of decorators.
   */
  static makeClassDecorator<T extends AnyFn>(transform?: T, debugFactoryName?: string, decoratorId?: AnyFn) {
    function classDecoratorFactory(...args: Parameters<T>): any {
      const value = transform ? transform(...args) : [...args];
      const declaredInDir = CallsiteUtils.getCallerDir();
      return function classDecorator(Cls: Class): void {
        const classDecorValues = Reflector.getRawMeta(Cls, CLASS_KEY, undefined, [] as DecoratorAndValue[]);
        const decoratorAndValue = new DecoratorAndValue(decoratorId || classDecoratorFactory, value, declaredInDir);
        classDecorValues.push(decoratorAndValue);
      };
    }
    this.setDecoratorFactoryName(classDecoratorFactory, debugFactoryName);
    return classDecoratorFactory;
  }
  /**
   * @param transform Such a transformer should not use symbols that can be wrapped with `forwardRef()`,
   * because at this stage the `resolveForwardRef()` function will not work correctly.
   * @param debugFactoryName Gives a name to the decorator that can be viewed during debugging.
   * @param decoratorId Sometimes it is not enough to identify the metadata returned by a specific decorator
   * using `instanceof`. Sometimes it is useful to have a single identifier for a certain group of decorators.
   */
  static makeParamDecorator<T extends AnyFn>(transform?: T, debugFactoryName?: string, decoratorId?: AnyFn) {
    function paramDecorFactory(...args: Parameters<T>) {
      const value = transform ? transform(...args) : [...args];
      return function paramDecorator(
        classOrInstance: Class | object,
        propertyKey: string | symbol | undefined,
        index: number,
      ): void {
        // This function can be called for a class constructor and methods.
        const Cls = isType(classOrInstance) ? classOrInstance : (classOrInstance.constructor as Class);
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
    this.setDecoratorFactoryName(paramDecorFactory, debugFactoryName);
    return paramDecorFactory;
  }
  /**
   * @param transform Such a transformer should not use symbols that can be wrapped with `forwardRef()`,
   * because at this stage the `resolveForwardRef()` function will not work correctly.
   * @param debugFactoryName Gives a name to the decorator that can be viewed during debugging.
   * @param decoratorId Sometimes it is not enough to identify the metadata returned by a specific decorator
   * using `instanceof`. Sometimes it is useful to have a single identifier for a certain group of decorators.
   */
  static makePropDecorator<T extends AnyFn>(transform?: T, debugFactoryName?: string, decoratorId?: AnyFn) {
    function propDecorFactory(...args: Parameters<T>) {
      const value = transform ? transform(...args) : [...args];
      return function propDecorator(target: any, propertyKey: string | symbol): void {
        const Cls = target.constructor as Class;
        const defaultValue = {} as Record<string | symbol, DecoratorAndValue[]>;
        const item = new DecoratorAndValue(decoratorId || propDecorFactory, value);
        Reflector.getRawMeta(Cls, PROP_KEY, propertyKey, item);
        const meta = Reflector.getRawMeta(Cls, PROP_KEY, undefined, defaultValue);
        (meta[propertyKey] ??= []).push(item);
      };
    }
    this.setDecoratorFactoryName(propDecorFactory, debugFactoryName);
    return propDecorFactory;
  }
  /**
   * @param Cls The class from which to return the metadata.
   * @param typeGuard Type guard, which will search for necessary decorators.
   * @returns Returns an array of `DecoratorAndValue` for the passed `Cls`, using the passed `typeGuard`,
   * or `undefined` if no appropriate decorators.
   */
  static getDecorators<T extends DecoratorAndValue>(
    Cls: Class | ForwardRefFn<Class>,
    typeGuard: TypeGuard<T>,
  ): (T extends DecoratorAndValue<infer V> ? DecoratorAndValue<V> : never)[] | undefined;
  /**
   * @param Cls The class from which to return the metadata.
   * @param typeGuard Type guard, which will search for necessary decorators.
   * @returns Returns an array of `DecoratorAndValue` for the passed `Cls`,
   * or `undefined` if no appropriate decorators.
   */
  static getDecorators<T = any>(Cls: Class | ForwardRefFn<Class>): DecoratorAndValue<T>[] | undefined;
  static getDecorators<T extends DecoratorAndValue>(Cls: Class | ForwardRefFn<Class>, typeGuard?: TypeGuard<T>) {
    Cls = resolveForwardRef(Cls);
    let decorators = this.getMetadata(Cls)?.constructor.decorators || [];
    if (typeGuard) {
      decorators = decorators.filter(typeGuard);
    }
    return decorators.length ? decorators : undefined;
  }
  /**
   * Returns an object with all the metadata for the passed class.
   * This object implements [The iterable protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol).
   *
   * @param Cls A class that has decorators.
   */
  static getMetadata<DecorValue = any, Proto extends AnyObj = AnyObj>(
    Cls: Class<Proto>,
  ): ClassMeta<DecorValue, Proto> | undefined;
  /**
   * Returns the metadata for the constructor or methods of the passed class.
   *
   * @param Cls A class that has decorators.
   */
  static getMetadata<DecorValue = any, Proto extends AnyObj = AnyObj>(
    Cls: Class<Proto>,
    propertyKey?: keyof Proto | 'constructor' | symbol | (string & {}),
  ): ClassPropMeta<DecorValue> | undefined;
  static getMetadata<DecorValue = any, Proto extends AnyObj = AnyObj>(
    Cls: Class<Proto>,
    propertyKey: string | symbol | undefined = 'constructor',
  ): ClassMeta<DecorValue, Proto> | ClassPropMeta<DecorValue> | undefined {
    const classMeta = new ClassMetaIterator() as ClassMeta<DecorValue, Proto>;
    if (!isType(Cls)) {
      return;
    }

    if (arguments.length == 2 && !propertyKey) {
      propertyKey = 'constructor';
    }

    let cache = this.getOwnCacheMetadata<DecorValue, Proto>(Cls);
    if (cache === null) {
      this.concatWithParentClassMeta(Cls, classMeta);
      cache = this.concatWithOwnClassMeta(Cls, classMeta);
    }

    return this.getClassMetaOrParamsMeta(Cls, cache!, propertyKey);
  }

  static setRawClassMeta(Cls: Class, classDecorator: AnyFn) {
    classDecorator(Cls);
  }

  static getRawClassMeta(Cls: Class) {
    return this.getRawMeta(Cls, CLASS_KEY);
  }

  static setRawParamMeta<T extends AnyObj>(
    Cls: Class<T>,
    propertyKey: string | symbol | undefined,
    index: number,
    paramDecorator: AnyFn,
  ) {
    paramDecorator(Cls, propertyKey, index);
  }
  /**
   * @param propertyKey If this parameter is `undefined`, constructor parameters are passed.
   */
  static getRawParamMeta<T extends AnyObj>(Cls: Class<T>, propertyKey?: KeyOf<T>) {
    return this.getRawMeta(Cls, PARAMS_KEY, propertyKey);
  }

  static getRawPropMeta<T extends AnyObj>(Cls: Class<T>, propertyKey?: KeyOf<T>) {
    return this.getRawMeta(Cls, PROP_KEY, propertyKey);
  }

  static getRawMeta<T extends AnyObj, R = any>(
    Cls: Class<T> | T,
    metadataKey: any,
    propertyKey?: KeyOf<T>,
    defaultValue?: R,
  ): R {
    if (propertyKey) {
      if (defaultValue !== undefined && !Reflect.hasOwnMetadata(metadataKey, Cls, propertyKey)) {
        Reflect.defineMetadata(metadataKey, defaultValue, Cls, propertyKey);
      }
      return Reflect.getOwnMetadata(metadataKey, Cls, propertyKey);
    }
    if (defaultValue !== undefined && !Reflect.hasOwnMetadata(metadataKey, Cls)) {
      Reflect.defineMetadata(metadataKey, defaultValue, Cls);
    }
    return Reflect.getOwnMetadata(metadataKey, Cls);
  }

  protected static setDecoratorFactoryName(factory: AnyFn, debugFactoryName?: string) {
    if (debugFactoryName) {
      Object.defineProperty(factory, 'name', { value: debugFactoryName });
    }
  }

  protected static getClassMetaOrParamsMeta<DecorValue = any, Proto extends object = object>(
    Cls: Class<Proto>,
    classMeta: ClassMeta<DecorValue, Proto> | undefined,
    propertyKey?: string | symbol,
  ): ClassMeta<DecorValue, Proto> | ClassPropMeta<DecorValue> | undefined {
    if (propertyKey) {
      const classPropMeta = classMeta?.[propertyKey as keyof Proto];
      if (classPropMeta) {
        return classPropMeta;
      } else {
        const params = this.getParamsMetadata(Cls, propertyKey as Exclude<keyof Proto, number>);
        const classPropMeta = { type: UnknownType, decorators: [], params } as ClassPropMeta;
        return classPropMeta;
      }
    } else {
      return classMeta;
    }
  }

  protected static concatWithParentClassMeta<DecorValue = any, Proto extends AnyObj = object>(
    Cls: Class<Proto>,
    classMeta: ClassMeta<DecorValue, Proto>,
  ) {
    const parentClass = this.getParentClass(Cls);
    if (parentClass !== Object) {
      const parentPropMeta = this.getMetadata(parentClass);
      // Merging current meta with parent meta
      if (parentPropMeta) {
        Reflect.ownKeys(parentPropMeta).forEach((propName) => {
          const classPropMeta = { ...parentPropMeta[propName as any] };
          classPropMeta.decorators = classPropMeta.decorators.slice();
          classPropMeta.params = classPropMeta.params.slice();
          if ((classPropMeta as any)[DEPS_KEY]) {
            (classPropMeta as any)[DEPS_KEY] = (classPropMeta as any)[DEPS_KEY].slice();
          }
          (classMeta as any)[propName] = classPropMeta;
        });
      }
    }
  }

  protected static concatWithOwnClassMeta<DecorValue = any, Proto extends AnyObj = object>(
    Cls: Class<Proto>,
    classMeta: ClassMeta<DecorValue, Proto>,
  ) {
    const ownPropMetadata = this.getRawPropMeta(Cls);
    let ownMetaKeys: (string | symbol)[] = [];
    if (ownPropMetadata) {
      ownMetaKeys = Reflect.ownKeys(ownPropMetadata);
    }
    ownMetaKeys.forEach((propName) => {
      const type = Reflect.getOwnMetadata('design:type', Cls.prototype, propName);
      const decorators = ownPropMetadata![propName];
      if (classMeta.hasOwnProperty(propName)) {
        const classPropMeta = (classMeta as any)[propName] as ClassPropMeta;
        classPropMeta.type = type; // Override parent type.
        classPropMeta.params = []; // Remove parent params.
        classPropMeta.decorators.unshift(...decorators);
      } else {
        (classMeta as any)[propName] = { type, decorators, params: [] } as ClassPropMeta;
      }

      if ((classMeta as any)[propName].type === Function) {
        const classPropMeta = (classMeta as any)[propName] as ClassPropMeta;
        classPropMeta.params = this.getParamsMetadata(Cls, propName as any);
      }
    });

    return this.concatWithParamsMeta(Cls, classMeta, ownMetaKeys);
  }

  protected static concatWithParamsMeta<DecorValue = any, Proto extends AnyObj = object>(
    Cls: Class<Proto>,
    classMeta: ClassMeta<DecorValue, Proto>,
    ownMetaKeys: (string | symbol)[],
  ): ClassMeta<DecorValue, Proto> | undefined {
    const methodNames = Reflector.getRawMeta(Cls, METHODS_WITH_PARAMS, undefined, new Set());
    methodNames.add('constructor');
    methodNames.forEach((propName: any) => {
      if (ownMetaKeys.includes(propName)) {
        return;
      }
      if (!classMeta.hasOwnProperty(propName)) {
        (classMeta as any)[propName] = { type: Class, decorators: [], params: [] } as ClassPropMeta;
      }
      const classPropMeta = (classMeta as any)[propName] as ClassPropMeta;
      classPropMeta.params = this.getParamsMetadata(Cls, propName as any);
      delete (classPropMeta as any)[DEPS_KEY];
      if (propName == 'constructor') {
        classPropMeta.decorators = this.getClassMetadata(Cls);
      }
    });

    if (
      Reflect.ownKeys(classMeta).length == 1 &&
      !classMeta.constructor.decorators.length &&
      !classMeta.constructor.params.length
    ) {
      this.setMetaCache(Cls, CACHE_KEY, undefined);
      return;
    }

    this.setMetaCache(Cls, CACHE_KEY, classMeta);
    return classMeta;
  }

  protected static setMetaCache<DecorValue = any, Proto extends AnyObj = object>(
    Cls: Class<Proto>,
    metadataKey: string | symbol,
    classMeta?: ClassMeta<DecorValue, Proto>,
  ) {
    Reflect.defineMetadata(metadataKey, classMeta, Cls);
  }

  protected static getOwnCacheMetadata<DecorValue = any, Proto extends object = object>(Cls: any) {
    if (Reflect.hasOwnMetadata(CACHE_KEY, Cls)) {
      return Reflect.getOwnMetadata(CACHE_KEY, Cls) as ClassMeta<DecorValue, Proto> | undefined;
    }
    return null;
  }

  /**
   * Returns the metadata for passed class.
   *
   * @param Cls A class that has decorators.
   */
  protected static getClassMetadata<T = any>(Cls: Class): DecoratorAndValue<T>[] {
    if (!isType(Cls)) {
      return [];
    }
    const parentClass = this.getParentClass(Cls);
    const ownClassAnnotations = this.getRawClassMeta(Cls) || [];
    const parentAnnotations = parentClass !== Object ? this.getClassMetadata<T>(parentClass) : [];
    return ownClassAnnotations.concat(parentAnnotations);
  }

  /**
   * Returns the metadata for the constructor or methods of the passed class.
   *
   * @param Cls A class that has decorators.
   * @param propertyKey If this method is called without `propertyKey`,
   * it's returns parameters of class constructor.
   */
  protected static getParamsMetadata<T extends object>(
    Cls: Class<T>,
    propertyKey?: Exclude<keyof T, number>,
  ): (ParamsMeta | null)[] {
    if (!isType(Cls)) {
      return [];
    }
    const isConstructor = !propertyKey || propertyKey == 'constructor';

    /**
     * If we have no decorators, we only have function.length as metadata.
     * In that case, to detect whether a child class declared an own constructor or not,
     * we need to look inside of that constructor to check whether it is
     * just calling the parent.
     * This also helps to work around for https://github.com/Microsoft/TypeScript/issues/12439
     * that sets 'design:paramtypes' to []
     * if a class inherits from another class but has no ctor declared itself.
     */
    if (isConstructor && isDelegateCtor(Cls.toString())) {
      const parentClass = this.getParentClass(Cls);
      if (parentClass !== Object) {
        return this.getParamsMetadata(parentClass, propertyKey);
      }
      return [];
    } else {
      return this.getOwnParams(Cls, propertyKey);
    }
  }

  protected static getParentClass(ctor: Class): Class {
    const parentProto = ctor.prototype ? Object.getPrototypeOf(ctor.prototype) : null;
    const parentClass = parentProto ? parentProto.constructor : null;
    // Note: We always use `Object` as the null value
    // to simplify checking later on.
    return parentClass || Object;
  }

  protected static mergeTypesAndClassMeta(paramTypes: any[], paramMetadata: any[]): ParamsMeta[] {
    let result: ParamsMeta[];

    if (paramTypes === undefined) {
      result = newArray(paramMetadata.length);
    } else {
      result = newArray(paramTypes.length);
    }

    for (let i = 0; i < result.length; i++) {
      // TS outputs Object for parameters without types, while Traceur omits
      // the annotations. For now we preserve the Traceur behavior to aid
      // migration, but this can be revisited.
      if (paramTypes === undefined) {
        result[i] = [];
      } else if (paramTypes[i] && paramTypes[i] != Object) {
        result[i] = [paramTypes[i]] as unknown as ParamsMeta;
      } else {
        result[i] = [];
      }
      if (paramMetadata && paramMetadata[i] != null) {
        result[i] = result[i].concat(paramMetadata[i]) as ParamsMeta;
      }
    }
    return result;
  }

  protected static getOwnParams(Cls: Class, propertyKey?: string | symbol): ParamsMeta[] | null[] {
    const isConstructor = !propertyKey || propertyKey == 'constructor';
    const paramMetadata = isConstructor ? Reflector.getRawParamMeta(Cls) : Reflector.getRawParamMeta(Cls, propertyKey);
    const args = (isConstructor ? [Cls] : [Cls.prototype, propertyKey]) as [Class];
    const paramTypes = Reflect.getOwnMetadata('design:paramtypes', ...args);

    if (paramTypes || paramMetadata) {
      return this.mergeTypesAndClassMeta(paramTypes, paramMetadata);
    }

    /**
     * If a class or method has no decorators, at least create metadata
     * based on function.length.
     */
    if (propertyKey && !isConstructor) {
      const descriptor = Object.getOwnPropertyDescriptor(Cls.prototype, propertyKey);
      return newArray(descriptor?.value?.length || 0, null);
    } else {
      return newArray(Cls.length, null);
    }
  }
}
