import type { AnyObj } from '#types/mix.js';
import type { AnyFn } from './top/types-and-models.js';
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
} from './top/types-and-models.js';
import { DecoratorAndValue } from './top/decorator-and-value.js';
import { CACHE_KEY, CLASS_KEY, DEPS_KEY, PARAMS_KEY, METHODS_WITH_PARAMS, PROP_KEY } from './top/constants.js';
import { isType, newArray } from './utils.js';

type KeyOfClass<Proto extends AnyObj> = keyof Proto | 'constructor' | symbol | (string & {});
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
        const decoratorAndValue = new DecoratorAndValue(classDecoratorFactory, value, decoratorId, declaredInDir);
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
  static makePropDecorator<T extends AnyFn>(transform?: T, debugFactoryName?: string, decoratorId?: AnyFn) {
    function propDecorFactory(...args: Parameters<T>) {
      const value = transform ? transform(...args) : [...args];
      return function propDecorator(target: any, propertyKey: string | symbol): void {
        const Cls = target.constructor as Class;
        const defaultValue = {} as Record<string | symbol, DecoratorAndValue[]>;
        const item = new DecoratorAndValue(propDecorFactory, value, decoratorId);
        Reflector.getRawMeta(Cls, PROP_KEY, propertyKey, item);
        const meta = Reflector.getRawMeta(Cls, PROP_KEY, undefined, defaultValue);
        (meta[propertyKey] ??= []).push(item);
      };
    }
    this.setDecoratorFactoryName(propDecorFactory, debugFactoryName);
    return propDecorFactory;
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

        (parameters[index] ??= []).push(new DecoratorAndValue(paramDecorFactory, value, decoratorId));
      };
    }
    this.setDecoratorFactoryName(paramDecorFactory, debugFactoryName);
    return paramDecorFactory;
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
    let decorators = this.collectMetadata(Cls)?.constructor.decorators || [];
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
  static collectMetadata<DecorValue = any, Proto extends AnyObj = AnyObj>(
    Cls: Class<Proto>,
  ): ClassMeta<DecorValue, Proto> | undefined;
  /**
   * Returns the metadata for the constructor or methods of the passed class.
   *
   * @param Cls A class that has decorators.
   */
  static collectMetadata<DecorValue = any, Proto extends AnyObj = AnyObj>(
    Cls: Class<Proto>,
    propertyKey?: KeyOfClass<Proto>,
  ): ClassPropMeta<DecorValue> | undefined;
  static collectMetadata<DecorValue = any, Proto extends AnyObj = AnyObj>(
    Cls: Class<Proto>,
    propertyKey?: string | symbol,
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
      this.concatWithParentMeta(Cls, classMeta);
      cache = this.concatWithOwnMeta(Cls, classMeta);
    }

    return this.getClassMetaOrParamsMeta(Cls, cache!, propertyKey);
  }

  protected static getOwnCacheMetadata<DecorValue = any, Proto extends object = object>(Cls: any) {
    if (Reflect.hasOwnMetadata(CACHE_KEY, Cls)) {
      return Reflect.getOwnMetadata(CACHE_KEY, Cls) as ClassMeta<DecorValue, Proto> | undefined;
    }
    return null;
  }

  protected static concatWithParentMeta<DecorValue = any, Proto extends AnyObj = object>(
    Cls: Class<Proto>,
    classMeta: ClassMeta<DecorValue, Proto>,
  ) {
    const ParentCls = this.getParentClass(Cls);
    if (ParentCls !== Object) {
      const parentPropMeta = this.collectMetadata(ParentCls);
      // Merging current meta with parent meta
      if (parentPropMeta) {
        Reflect.ownKeys(parentPropMeta).forEach((propName) => {
          const propMeta = { ...parentPropMeta[propName as any] };
          propMeta.decorators = propMeta.decorators.slice();
          propMeta.params = propMeta.params.slice();
          propMeta.newParams = new Map([[Cls, propMeta.params]]);
          if ((propMeta as any)[DEPS_KEY]) {
            (propMeta as any)[DEPS_KEY] = (propMeta as any)[DEPS_KEY].slice();
          }
          (classMeta as any)[propName] = propMeta;
        });
      }
    }
  }

  protected static getParentClass(Cls: Class): Class {
    const parentProto = Cls.prototype ? Object.getPrototypeOf(Cls.prototype) : null;
    const parentClass = parentProto ? parentProto.constructor : null;
    // Note: We always use `Object` as the null value
    // to simplify checking later on.
    return parentClass || Object;
  }

  protected static concatWithOwnMeta<DecorValue = any, Proto extends AnyObj = object>(
    Cls: Class<Proto>,
    classMeta: ClassMeta<DecorValue, Proto>,
  ) {
    const ownPropsMeta = this.getRawPropMeta(Cls) as Record<string | symbol, DecoratorAndValue[]> | undefined;
    let ownPropsWithMeta: (string | symbol)[] = [];
    if (ownPropsMeta) {
      ownPropsWithMeta = Reflect.ownKeys(ownPropsMeta);
    }
    ownPropsWithMeta.forEach((propertyKey) => {
      const type = Reflect.getOwnMetadata('design:type', Cls.prototype, propertyKey);
      const decorators = ownPropsMeta![propertyKey];
      if (classMeta.hasOwnProperty(propertyKey)) {
        const classPropMeta = (classMeta as any)[propertyKey] as ClassPropMeta;
        classPropMeta.type = type; // Override parent type.
        classPropMeta.params = []; // Remove parent params.
        classPropMeta.decorators.unshift(...decorators);
      } else {
        (classMeta as any)[propertyKey] = { type, decorators, params: [], newParams: new Map() } as ClassPropMeta;
      }

      if ((classMeta as any)[propertyKey].type === Function) {
        const classPropMeta = (classMeta as any)[propertyKey] as ClassPropMeta;
        classPropMeta.params = this.getParamsMeta(Cls, propertyKey as any);
        classPropMeta.newParams = new Map([[Cls, classPropMeta.params]]);
      }
    });

    this.removeOverridenParams(Cls, classMeta, ownPropsWithMeta);
    return this.concatWithParamsMeta(Cls, classMeta, ownPropsWithMeta);
  }

  static getRawPropMeta<T extends AnyObj>(Cls: Class<T>, propertyKey?: KeyOfClass<T>) {
    return this.getRawMeta(Cls, PROP_KEY, propertyKey);
  }

  /**
   * Returns the metadata for the constructor or methods of the passed class.
   *
   * @param Cls A class that has decorators.
   * @param propertyKey If this method is called without `propertyKey`,
   * it's returns parameters of class constructor.
   */
  protected static getParamsMeta<T extends object>(Cls: Class<T>, propertyKey?: KeyOfClass<T>): (ParamsMeta | null)[] {
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
        return this.getParamsMeta(parentClass, propertyKey);
      }
      return [];
    } else {
      return this.getOwnParamsMeta(Cls, propertyKey);
    }
  }

  protected static getOwnParamsMeta<T extends AnyObj>(Cls: Class, propertyKey?: KeyOfClass<T>): ParamsMeta[] | null[] {
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
  static getRawParamMeta<T extends AnyObj>(Cls: Class<T>, propertyKey?: KeyOfClass<T>) {
    return this.getRawMeta(Cls, PARAMS_KEY, propertyKey);
  }

  static getRawMeta<T extends AnyObj, R = any>(
    Cls: Class<T> | T,
    metadataKey: any,
    propertyKey?: KeyOfClass<T>,
    defaultValue?: R,
  ): R {
    if (propertyKey) {
      if (defaultValue !== undefined && !Reflect.hasOwnMetadata(metadataKey, Cls, propertyKey as string)) {
        Reflect.defineMetadata(metadataKey, defaultValue, Cls, propertyKey as string);
      }
      return Reflect.getOwnMetadata(metadataKey, Cls, propertyKey as string);
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
        const params = this.getParamsMeta(Cls, propertyKey as KeyOfClass<Proto>);
        const newParams = new Map<Class, (ParamsMeta | null)[]>([[Cls, params]]);
        const classPropMeta = { type: UnknownType, decorators: [], params, newParams } as ClassPropMeta;
        return classPropMeta;
      }
    } else {
      return classMeta;
    }
  }

  /**
   * If a child class overrides a parent method but does not have a property decorator or params decorator,
   * the parent parameters must be removed.
   *
   * @param objWithParentMeta This object may have inherited methods from a parent class.
   */
  protected static removeOverridenParams<DecorValue = any, Proto extends AnyObj = object>(
    Cls: Class<Proto>,
    objWithParentMeta: ClassMeta<DecorValue, Proto>,
    ownPropsWithMeta: (string | symbol)[],
  ) {
    if (typeof Cls.prototype != 'object') {
      // @todo Check what is the case
      return;
    }

    const allClassMethods = Reflect.ownKeys(Cls.prototype).filter((prop) => {
      const descriptor = Object.getOwnPropertyDescriptor(Cls.prototype, prop);
      return typeof descriptor?.value == 'function';
    });

    Reflect.ownKeys(objWithParentMeta).forEach((propertyKey) => {
      if (allClassMethods.includes(propertyKey) && !ownPropsWithMeta.includes(propertyKey)) {
        objWithParentMeta[propertyKey].params = [];
      }
    });
  }

  protected static concatWithParamsMeta<DecorValue = any, Proto extends AnyObj = object>(
    Cls: Class<Proto>,
    classMeta: ClassMeta<DecorValue, Proto>,
    ownProps: (string | symbol)[],
  ): ClassMeta<DecorValue, Proto> | undefined {
    const methodNames = Reflector.getRawMeta(Cls, METHODS_WITH_PARAMS, undefined, new Set());
    methodNames.add('constructor');
    methodNames.forEach((propName: any) => {
      if (ownProps.includes(propName)) {
        return;
      }
      if (!classMeta.hasOwnProperty(propName)) {
        (classMeta as any)[propName] = {
          type: Class,
          decorators: [],
          params: [],
          newParams: new Map(),
        } as ClassPropMeta;
      }
      const classPropMeta = (classMeta as any)[propName] as ClassPropMeta;
      classPropMeta.params = this.getParamsMeta(Cls, propName as any);
      classPropMeta.newParams = new Map([[Cls, classPropMeta.params]]);
      delete (classPropMeta as any)[DEPS_KEY];
      if (propName == 'constructor') {
        classPropMeta.decorators = this.getClassMeta(Cls);
      }
    });

    if (
      Reflect.ownKeys(classMeta).length == 1 &&
      !classMeta.constructor.decorators.length &&
      // !classMeta.constructor.params.length &&
      !classMeta.constructor.newParams.size
    ) {
      this.setMetaCache(Cls, CACHE_KEY, undefined);
      return;
    }

    this.setMetaCache(Cls, CACHE_KEY, classMeta);
    return classMeta;
  }

  protected static setMetaCache<DecorValue = any, Proto extends AnyObj = object>(
    Cls: Class<Proto>,
    metadataKey: any,
    classMeta?: ClassMeta<DecorValue, Proto>,
  ) {
    Reflect.defineMetadata(metadataKey, classMeta, Cls);
  }

  /**
   * Returns the metadata for passed class.
   *
   * @param Cls A class that has decorators.
   */
  protected static getClassMeta<T = any>(Cls: Class): DecoratorAndValue<T>[] {
    if (!isType(Cls)) {
      return [];
    }
    const parentClass = this.getParentClass(Cls);
    const ownClassAnnotations = this.getRawClassMeta(Cls) || [];
    const parentAnnotations = parentClass === Object ? [] : this.getClassMeta<T>(parentClass);
    return ownClassAnnotations.concat(parentAnnotations);
  }

  protected static mergeTypesAndClassMeta(paramTypes: any[] | undefined, paramMetadata: any[]): ParamsMeta[] {
    let result: ParamsMeta[];

    if (paramTypes === undefined) {
      result = newArray(paramMetadata.length);
    } else {
      result = newArray(paramTypes.length);
    }

    for (let i = 0; i < result.length; i++) {
      if (paramTypes === undefined || paramTypes[i] === Object) {
        result[i] = [];
      } else if (paramTypes[i]) {
        result[i] = [paramTypes[i]] as ParamsMeta;
      }
      if (paramMetadata && paramMetadata[i] != null) {
        result[i] = result[i].concat(paramMetadata[i]) as ParamsMeta;
      }
    }
    return result;
  }
}
