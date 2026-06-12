import type { AnyObj } from '#types/mix.js';
import type { AnyFn, ParameterItem } from './top/types-and-models.js';
import type { ParameterMeta, ClassMeta, ClassPropMeta, TypeGuard } from './top/types-and-models.js';
import { CallsiteUtils } from '#utils/callsites.js';
import { ClassMetaIterator } from './class-meta-iterator.js';
import { Class, UnknownType } from './top/types-and-models.js';
import { DecoratorAndValue } from './top/decorator-and-value.js';
import { CACHE_KEY, CLASS_KEY, DEPS_KEY, PARAMS_KEY, METHODS_WITH_PARAMS, PROP_KEY } from './top/constants.js';
import { isType, newArray } from './utils.js';
import type { InjectionToken } from './top/injection-token.js';
import type { InjectionSymbol } from './top/get-symbol.js';

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
      // Capture the decorator declaration directory while the decorator factory is executed.
      // Later, module discovery uses this location to resolve relative metadata.
      const declaredInDir = CallsiteUtils.getCallerDir();
      return function classDecorator(Cls: Class): void {
        const classDecorValues = Reflector.getRawMeta(Cls, CLASS_KEY, undefined, []);
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
        const item = new DecoratorAndValue(propDecorFactory, value, decoratorId);
        // Store both quick per-property metadata and the property list used by this.collectMetadata().
        // Reflector.getRawMeta(Cls, PROP_KEY, propertyKey, item);
        const meta = Reflector.getRawMeta(Cls, PROP_KEY, undefined, {});
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
        const parameters = Reflector.getRawMeta(Cls, PARAMS_KEY, propertyKey, []);
        const methodNames = Reflector.getRawMeta(Cls, METHODS_WITH_PARAMS, undefined, new Set());
        // TypeScript emits parameter metadata only for decorated declarations, so keep
        // an explicit registry of constructors and methods that have parameter decorators.
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
    Cls: Class,
    typeGuard: TypeGuard<T>,
  ): (T extends DecoratorAndValue<infer V> ? DecoratorAndValue<V> : never)[] | undefined;
  /**
   * @param Cls The class from which to return the metadata.
   * @param typeGuard Type guard, which will search for necessary decorators.
   * @returns Returns an array of `DecoratorAndValue` for the passed `Cls`,
   * or `undefined` if no appropriate decorators.
   */
  static getDecorators<T = any>(Cls: Class): DecoratorAndValue<T>[] | undefined;
  static getDecorators<T extends DecoratorAndValue>(Cls: Class, typeGuard?: TypeGuard<T>) {
    let decorators = this.collectMetadata(Cls)?.constructor.decorators || [];
    if (typeGuard) {
      decorators = decorators.filter(typeGuard);
    }
    return decorators.length ? decorators : undefined;
  }
  /**
   * Returns an instance of {@link ClassMetaIterator}, which implements the [iterable protocol][1].
   * Each property of this class corresponds to a property with a decorator in the `Cls` parameter, and the value
   * of that property contains the normalized metadata returned by the decorator transformers.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol
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

    // A second argument with undefined explicitly asks for constructor metadata.
    // A missing second argument asks for the whole class metadata iterator.
    if (arguments.length == 2 && !propertyKey) {
      propertyKey = 'constructor';
    }

    let cache = this.getOwnCacheMetadata<DecorValue, Proto>(Cls);
    if (!cache) {
      // Build a fresh metadata view once, then cache it on the class constructor.
      // Parent metadata is copied first so own metadata can override or prepend it.
      this.concatWithParentMeta(Cls, classMeta);
      cache = this.concatWithOwnMeta(Cls, classMeta);
    }

    return this.getClassMetaOrParamsMeta(Cls, cache, propertyKey);
  }

  protected static getOwnCacheMetadata<DecorValue = any, Proto extends object = object>(Cls: any) {
    return Reflect.getOwnMetadata(CACHE_KEY, Cls) as ClassMeta<DecorValue, Proto> | undefined;
  }

  protected static createClassPropMeta<DecorValue = any>(
    type: Class = UnknownType,
    decorators: DecoratorAndValue<DecorValue>[] = [],
    params: (ParameterMeta | null)[] = [],
    newParams = new Map<Class, (ParameterMeta | null)[]>(),
  ): ClassPropMeta<DecorValue> {
    return { type, decorators, params, newParams };
  }

  protected static concatWithParentMeta<DecorValue = any, Proto extends AnyObj = object>(
    Cls: Class<Proto>,
    classMeta: ClassMeta<DecorValue, Proto>,
  ) {
    const ParentCls = this.getParentClass(Cls);
    if (ParentCls) {
      const parentClassMeta = this.collectMetadata(ParentCls);
      // Merging current meta with parent meta
      if (parentClassMeta) {
        Reflect.ownKeys(parentClassMeta).forEach((propertyKey) => {
          // Child metadata must be mutable without mutating the already cached parent view.
          const propMeta = { ...parentClassMeta[propertyKey as any] };
          propMeta.decorators = propMeta.decorators.slice();
          if (propMeta[DEPS_KEY]) {
            // Dependency metadata is attached later by the injector, but inherited
            // reflector metadata may already carry it from a previous resolution.
            propMeta[DEPS_KEY] = { ...propMeta[DEPS_KEY]! };
            propMeta[DEPS_KEY]!.deps = propMeta[DEPS_KEY]!.deps.slice();
          }
          (classMeta as any)[propertyKey] = propMeta;
        });
      }
    }
  }

  protected static getParentClass(Cls: Class): Class | undefined {
    const parentClass = Object.getPrototypeOf(Cls.prototype).constructor;
    return parentClass == Object ? undefined : parentClass;
  }

  protected static concatWithOwnMeta<DecorValue = any, Proto extends AnyObj = object>(
    Cls: Class<Proto>,
    classMeta: ClassMeta<DecorValue, Proto>,
  ) {
    const ownPropsMeta = this.getRawPropMeta(Cls);
    const ownPropsWithMeta = ownPropsMeta ? Reflect.ownKeys(ownPropsMeta) : [];

    ownPropsWithMeta.forEach((propertyKey) => {
      const type = Reflect.getOwnMetadata('design:type', Cls.prototype, propertyKey);
      const decorators = ownPropsMeta![propertyKey];
      if (classMeta.hasOwnProperty(propertyKey)) {
        const classPropMeta = classMeta[propertyKey];
        // Own property metadata represents an override, so parent type and params no longer apply.
        classPropMeta.type = type;
        classPropMeta.params = [];
        classPropMeta.decorators.unshift(...decorators);
      } else {
        (classMeta as any)[propertyKey] = this.createClassPropMeta(type, decorators);
      }

      // Method decorators have design:type === Function. In that case the method
      // can also have parameter metadata and should expose it on the same property meta.
      if (classMeta[propertyKey].type === Function) {
        const classPropMeta = classMeta[propertyKey];
        classPropMeta.params = this.getParamsMeta(Cls, propertyKey);
        classPropMeta.newParams ??= new Map();
        classPropMeta.newParams.set(Cls, classPropMeta.params);
      }
    });

    if (this.getParentClass(Cls)) {
      this.removeOverridenParams(Cls, classMeta, ownPropsWithMeta);
    }
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
  protected static getParamsMeta<T extends object>(
    Cls: Class<T>,
    propertyKey?: KeyOfClass<T>,
  ): (ParameterMeta | null)[] {
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
      if (parentClass) {
        return this.getParamsMeta(parentClass, propertyKey);
      }
      return [];
    } else {
      return this.getOwnParamsMeta(Cls, propertyKey);
    }
  }

  protected static getOwnParamsMeta<T extends AnyObj>(
    Cls: Class,
    propertyKey?: KeyOfClass<T>,
  ): ParameterMeta[] | null[] {
    const isConstructor = !propertyKey || propertyKey == 'constructor';
    const paramDecoratorMeta = isConstructor
      ? Reflector.getRawParamMeta(Cls)
      : Reflector.getRawParamMeta(Cls, propertyKey);
    const args = (isConstructor ? [Cls] : [Cls.prototype, propertyKey]) as [Class];
    const paramTypes = Reflect.getOwnMetadata('design:paramtypes', ...args) as Class[];

    if (paramTypes || paramDecoratorMeta) {
      return this.mergeTypesAndParamDecoratorMeta(paramTypes, paramDecoratorMeta);
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
    metadataKey: InjectionToken<R> | InjectionSymbol<R>,
    propertyKey?: KeyOfClass<T>,
  ): R | undefined;
  static getRawMeta<T extends AnyObj, R = any>(
    Cls: Class<T> | T,
    metadataKey: InjectionToken<R> | InjectionSymbol<R>,
    propertyKey: KeyOfClass<T> | undefined,
    defaultValue: R,
  ): R;
  static getRawMeta<T extends AnyObj, R = any>(
    Cls: Class<T> | T,
    metadataKey: any,
    propertyKey?: KeyOfClass<T>,
  ): R | undefined;
  static getRawMeta<T extends AnyObj, R = any>(
    Cls: Class<T> | T,
    metadataKey: any,
    propertyKey: KeyOfClass<T> | undefined,
    defaultValue: R,
  ): R;
  static getRawMeta<T extends AnyObj, R = any>(
    Cls: Class<T> | T,
    metadataKey: any,
    propertyKey?: KeyOfClass<T>,
    defaultValue?: R,
  ): R {
    if (propertyKey) {
      // Reflect metadata distinguishes metadata on a property from metadata on a class.
      // The optional default is installed only once to preserve identity for arrays/maps.
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
        // The requested method/property may have no decorators at all. Return a synthetic
        // metadata object so callers can still inspect function.length based params.
        const params = this.getParamsMeta(Cls, propertyKey as KeyOfClass<Proto>);
        const newParams = new Map<Class, (ParameterMeta | null)[]>([[Cls, params]]);
        return this.createClassPropMeta(UnknownType, [], params, newParams);
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
    ownPropsWithMeta: (string | symbol)[],
  ): ClassMeta<DecorValue, Proto> | undefined {
    const ownMethodsWithParams = Reflector.getRawMeta(Cls, METHODS_WITH_PARAMS, undefined, new Set<string | symbol>());
    // Constructor metadata is always normalized so class decorators and constructor params
    // share one stable metadata entry.
    ownMethodsWithParams.add('constructor');
    ownMethodsWithParams.forEach((methodWithParams) => {
      if (ownPropsWithMeta.includes(methodWithParams)) {
        return;
      }
      if (!classMeta.hasOwnProperty(methodWithParams)) {
        (classMeta as any)[methodWithParams] = this.createClassPropMeta(Class);
      }
      const classPropMeta = (classMeta as any)[methodWithParams] as ClassPropMeta;
      classPropMeta.params = this.getParamsMeta(Cls, methodWithParams);
      classPropMeta.newParams ??= new Map();
      classPropMeta.newParams.set(Cls, classPropMeta.params);
      // Parameter metadata changed, so previously resolved dependency metadata is stale.
      delete (classPropMeta as any)[DEPS_KEY];
      if (methodWithParams == 'constructor') {
        classPropMeta.decorators = this.getClassMeta(Cls);
      }
    });

    if (
      Reflect.ownKeys(classMeta).length == 1 &&
      !classMeta.constructor.decorators.length &&
      // !classMeta.constructor.params.length &&
      !classMeta.constructor.newParams.size
    ) {
      // Avoid caching an empty iterator for classes with no meaningful reflector metadata.
      this.setMetaCache(Cls, CACHE_KEY, undefined);
      return;
    }

    this.setMetaCache(Cls, CACHE_KEY, classMeta);
    return classMeta;
  }

  protected static setMetaCache<DecorValue = any, Proto extends AnyObj = object>(
    Cls: Class<Proto>,
    metadataKey: InjectionToken<ClassMeta<DecorValue, Proto>>,
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
    const parentAnnotations = parentClass ? this.getClassMeta<T>(parentClass) : [];
    return ownClassAnnotations.concat(parentAnnotations);
  }

  /**
   * Returns an array with the metadata of the method parameters. The following example shows
   * one case when the method has three parameters:
   * 
   ```ts
const paramsMeta = [
  [ SomeClass, DecoratorAndValue ], // First parameter
  [ DecoratorAndValue ], // Second parameter
  [ OtherClass ] // Third parameter
];
   ```
   * 
   * That is, the parameter metadata is presented as an array, where the class type can come first
   * (if the TypeScript compiler was able to determine it), or an instance of the `DecoratorAndValue`
   * class immediately follows (if a decorator is used at the parameter level).
   */
  protected static mergeTypesAndParamDecoratorMeta(
    paramTypes: Class[],
    paramDecoratorMeta: (DecoratorAndValue[] | null)[] | undefined,
  ): ParameterMeta[] {
    let mergedParamMeta: ParameterItem[][];

    if (paramTypes) {
      mergedParamMeta = new Array(paramTypes.length);
    } else {
      mergedParamMeta = paramDecoratorMeta ? new Array(paramDecoratorMeta.length) : [];
    }

    for (let paramIndex = 0; paramIndex < mergedParamMeta.length; paramIndex++) {
      if (paramTypes[paramIndex] === Object) {
        // TypeScript emit `Object` for types like `any`. Treat it as unknown
        // instead of using Object as an injection token.
        mergedParamMeta[paramIndex] = [];
      } else if (paramTypes[paramIndex]) {
        mergedParamMeta[paramIndex] = [paramTypes[paramIndex]] as [Class];
      }
      if (paramDecoratorMeta && paramDecoratorMeta[paramIndex] != null) {
        mergedParamMeta[paramIndex].push(...(paramDecoratorMeta[paramIndex] as DecoratorAndValue[]));
      }
    }
    return mergedParamMeta as ParameterMeta[];
  }
}
