import type { AnyObj } from '#types/mix.js';
import type {
  ParameterMeta,
  ClassMeta,
  TypeGuard,
  AnyFn,
  ParameterItem,
  MergedClassMeta,
  Class,
  AbstractClass,
} from './top/types-and-models.js';
import type { InjectionToken } from './top/injection-token.js';
import type { InjectionSymbol } from './top/get-symbol.js';
import { MergedClassPropMeta } from './top/types-and-models.js';
import { ClassPropMeta } from './top/types-and-models.js';
import { CallsiteUtils } from '#utils/callsites.js';
import { ClassMetaIterator } from './class-meta-iterator.js';
import { UnknownType } from './top/types-and-models.js';
import { DecoratorAndValue } from './top/decorator-and-value.js';
import { CLASS_KEY, PARAM_KEY, METHODS_WITH_PARAMS, PROP_KEY } from './top/constants.js';
import { isType, newArray } from './utils.js';

const mergedClassMetaCache = new WeakMap<Class, ClassMeta | undefined>();
const classMetaChainCache = new WeakMap<Class, ClassMetaChain | undefined>();

export type ClassMetaChain<DecorValue = any, Proto extends AnyObj = AnyObj> = Map<
  Class,
  ClassMeta<DecorValue, Proto> | undefined
>;
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
   * Creates a factory of decorators that operate work at the class level.
   * 
   * @param transform Such a transformer should not use symbols that can be wrapped with `forwardRef()`,
   * because at this stage the `resolveForwardRef()` function will not work correctly.
   * @param debugFactoryName Gives a name to the decorator that can be viewed during debugging.
   * @param decoratorId Acts as an identifier for a group of decorators whose transformers return metadata
   * of a specific base type. Essentially, it is an alternative to the class inheritance mechanism and
   * the use of `instanceof` for identifying the types returned by transformers.
   */
  static makeClassDecorator<T extends AnyFn>(transform?: T, debugFactoryName?: string, decoratorId?: AnyFn) {
    function classDecoratorFactory(...args: Parameters<T>) {
      const value = transform ? transform(...args) : [...args];
      // Capture the decorator declaration directory while the decorator factory is executed.
      // Later, module discovery uses this location to resolve relative metadata.
      const declaredInDir = CallsiteUtils.getCallerDir();
      return function classDecorator(Cls: AbstractClass | Class): void {
        const classDecorValues = Reflector.getRawMeta(Cls, CLASS_KEY, undefined, []);
        const decoratorAndValue = new DecoratorAndValue(classDecoratorFactory, value, decoratorId, declaredInDir);
        classDecorValues.push(decoratorAndValue);
      };
    }
    this.setDecoratorFactoryName(classDecoratorFactory, debugFactoryName);
    return classDecoratorFactory;
  }
  /**
   * Creates a factory of decorators that operate at the property or method level.
   * 
   * @param transform Such a transformer should not use symbols that can be wrapped with `forwardRef()`,
   * because at this stage the `resolveForwardRef()` function will not work correctly.
   * @param debugFactoryName Gives a name to the decorator that can be viewed during debugging.
   * @param decoratorId Acts as an identifier for a group of decorators whose transformers return metadata
   * of a specific base type. Essentially, it is an alternative to the class inheritance mechanism and
   * the use of `instanceof` for identifying the types returned by transformers.
   */
  static makePropDecorator<T extends AnyFn>(transform?: T, debugFactoryName?: string, decoratorId?: AnyFn) {
    function propDecorFactory(...args: Parameters<T>) {
      const value = transform ? transform(...args) : [...args];
      return function propDecorator(target: { constructor: Function }, propertyKey: string | symbol): void {
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
   * Creates a factory of decorators that operate at the method parameter level.
   * 
   * @param transform Such a transformer should not use symbols that can be wrapped with `forwardRef()`,
   * because at this stage the `resolveForwardRef()` function will not work correctly.
   * @param debugFactoryName Gives a name to the decorator that can be viewed during debugging.
   * @param decoratorId Acts as an identifier for a group of decorators whose transformers return metadata
   * of a specific base type. Essentially, it is an alternative to the class inheritance mechanism and
   * the use of `instanceof` for identifying the types returned by transformers.
   */
  static makeParamDecorator<T extends AnyFn>(transform?: T, debugFactoryName?: string, decoratorId?: AnyFn) {
    function paramDecorFactory(...args: Parameters<T>) {
      const value = transform ? transform(...args) : [...args];
      return function paramDecorator(
        classOrInstance: Class | { constructor: Function },
        propertyKey: string | symbol | undefined,
        index: number,
      ): void {
        // This function can be called for a class constructor and methods.
        const Cls = isType(classOrInstance) ? classOrInstance : (classOrInstance.constructor as Class);
        const parameters = Reflector.getRawMeta(Cls, PARAM_KEY, propertyKey, []);
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
   * of that property contains the normalized metadata with {@link MergedClassPropMeta}.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol
   *
   * @param Cls A class that has decorators.
   */
  static collectMetadata<DecorValue = any, Proto extends AnyObj = AnyObj>(
    Cls: Class<Proto>,
  ): MergedClassMeta<DecorValue, Proto> | undefined;
  /**
   * Returns the metadata for the constructor or methods of the passed class.
   *
   * @param Cls A class that has decorators.
   */
  static collectMetadata<DecorValue = any, Proto extends AnyObj = AnyObj>(
    Cls: Class<Proto>,
    propertyKey?: KeyOfClass<Proto>,
  ): MergedClassPropMeta<DecorValue> | undefined;
  static collectMetadata<DecorValue = any, Proto extends AnyObj = AnyObj>(
    Cls: Class<Proto>,
    propertyKey?: string | symbol,
  ): MergedClassMeta<DecorValue, Proto> | MergedClassPropMeta<DecorValue> | undefined {
    if (!isType(Cls)) {
      return;
    }

    // A second argument with undefined explicitly asks for constructor metadata.
    // A missing second argument asks for the whole class metadata iterator.
    if (arguments.length == 2 && !propertyKey) {
      propertyKey = 'constructor';
    }

    const mergedClassMeta = mergedClassMetaCache.has(Cls)
      ? (mergedClassMetaCache.get(Cls) as MergedClassMeta<DecorValue, Proto>)
      : this.mergeClassMeta<DecorValue, Proto>(Cls);

    return this.getClassMetaOrParamMeta(Cls, mergedClassMeta, propertyKey);
  }

  /**
   * __Disclaimer__: This method has experimental support.
   */
  static setClassMeta<Args extends any[]>(
    Cls: Class | AbstractClass,
    decoratorFactory: AnyFn<Args, (Cls: AbstractClass | Class) => void>,
    ...args: Args
  ) {
    return decoratorFactory(...args)(Cls);
  }

  /**
   * __Disclaimer__: This method has experimental support.
   */
  static setPropertyMeta<Args extends any[]>(
    Cls: Class | AbstractClass,
    propertyKey: string | symbol,
    propertyType: any,
    decoratorFactory: AnyFn<Args, PropertyDecorator>,
    ...args: Args
  ) {
    Reflect.defineMetadata('design:type', propertyType, Cls.prototype, propertyKey);
    return decoratorFactory(...args)({ constructor: Cls }, propertyKey);
  }

  /**
   * __Disclaimer__: This method has experimental support.
   */
  static setParameterMeta<Args extends any[]>(
    Cls: Class | AbstractClass,
    parameterMeta: ([any, AnyFn<Args, ParameterDecorator>, ...Args] | null | undefined)[],
  ): void;
  static setParameterMeta<Args extends any[]>(
    Cls: Class | AbstractClass,
    propertyKey: string | symbol,
    parameterMeta: ([any, AnyFn<Args, ParameterDecorator>, ...Args] | null | undefined)[],
  ): void;
  static setParameterMeta<Args extends any[]>(
    Cls: Class | AbstractClass,
    keyOrParamMeta: (string | symbol) | ([any, AnyFn<Args, ParameterDecorator>, ...Args] | null | undefined)[],
    parameterMeta?: ([any, AnyFn<Args, ParameterDecorator>, ...Args] | null | undefined)[],
  ) {
    let propertyKey: string | symbol;
    if (parameterMeta) {
      propertyKey = keyOrParamMeta as string | symbol;
    } else {
      propertyKey = '';
      parameterMeta = keyOrParamMeta as ([any, AnyFn<Args, ParameterDecorator>, ...Args] | null | undefined)[];
    }
    Reflect.defineMetadata('design:type', Function, Cls.prototype, propertyKey);
    const params: any[] = propertyKey
      ? Reflect.getOwnMetadata('design:paramtypes', Cls.prototype, propertyKey) || []
      : Reflect.getOwnMetadata('design:paramtypes', Cls) || [];

    parameterMeta.forEach((tuple, parameterIndex) => {
      if (tuple === null || tuple === undefined) return;
      const [parameterType, decoratorFactory, ...args] = tuple;
      params[parameterIndex] ??= parameterType ?? UnknownType;
      decoratorFactory(...args)(Cls, propertyKey, parameterIndex);
    });
    Reflect.defineMetadata('design:paramtypes', params, Cls.prototype, propertyKey);
  }

  protected static getRawMeta<T extends AnyObj, R = any>(
    Cls: Class<T> | T,
    metadataKey: InjectionToken<R> | InjectionSymbol<R>,
    propertyKey?: KeyOfClass<T>,
  ): R | undefined;
  protected static getRawMeta<T extends AnyObj, R = any>(
    Cls: Class<T> | T,
    metadataKey: InjectionToken<R> | InjectionSymbol<R>,
    propertyKey: KeyOfClass<T> | undefined,
    defaultValue: R,
  ): R;
  protected static getRawMeta<T extends AnyObj, R = any>(
    Cls: Class<T> | T,
    metadataKey: any,
    propertyKey?: KeyOfClass<T>,
  ): R | undefined;
  protected static getRawMeta<T extends AnyObj, R = any>(
    Cls: Class<T> | T,
    metadataKey: any,
    propertyKey: KeyOfClass<T> | undefined,
    defaultValue: R,
  ): R;
  protected static getRawMeta<T extends AnyObj, R = any>(
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

  protected static mergeClassMeta<DecorValue = any, Proto extends AnyObj = AnyObj>(Cls: Class<Proto>) {
    const mergedClassMeta = new ClassMetaIterator() as MergedClassMeta<DecorValue, Proto>;
    mergedClassMeta.constructor = new MergedClassPropMeta();

    const classMetaChain = this.collectMetaChain(Cls);
    classMetaChain?.forEach((classMeta, key) => {
      if (!classMeta) return;

      for (const prop of classMeta) {
        (mergedClassMeta as any)[prop] ??= new MergedClassPropMeta<DecorValue>();
        mergedClassMeta[prop].type = classMeta[prop].type;
        mergedClassMeta[prop].decorators = classMeta[prop].decorators.slice();
        mergedClassMeta[prop].params = classMeta[prop].params.slice();
        mergedClassMeta[prop].decoratorChain.set(key, classMeta[prop].decorators.slice());
        mergedClassMeta[prop].paramChain.set(key, classMeta[prop].params.slice());
      }
    });

    return this.removeOverridenParamsAndSaveCache(Cls, mergedClassMeta, classMetaChain);
  }

  protected static removeOverridenParamsAndSaveCache<DecorValue = any, Proto extends AnyObj = AnyObj>(
    Cls: Class<Proto>,
    mergedClassMeta: MergedClassMeta<DecorValue, Proto>,
    classMetaChain: ClassMetaChain<any, Proto> | undefined,
  ) {
    // If a child class overrides a parent method but does not have a property decoratoror params decorator,
    // the parent parameters must be removed.
    if (classMetaChain && classMetaChain.size > 1) {
      this.removeOverridenParams(Cls, mergedClassMeta);
    }

    if (
      Reflect.ownKeys(mergedClassMeta).length == 1 &&
      !mergedClassMeta.constructor.decorators.length &&
      !mergedClassMeta.constructor.params.length
    ) {
      // Avoid caching an empty iterator for classes with no meaningful reflector metadata.
      mergedClassMetaCache.set(Cls, undefined);
      return;
    }
    mergedClassMetaCache.set(Cls, mergedClassMeta);
    return mergedClassMeta;
  }

  /**
   * If a child class overrides a parent method but does not have a property decorator or params decorator,
   * the parent parameters must be removed.
   */
  protected static removeOverridenParams<DecorValue = any, Proto extends AnyObj = object>(
    Cls: Class<Proto>,
    mergedClassMeta: ClassMeta<DecorValue, Proto>,
  ) {
    const ownPropMeta = this.getRawMeta(Cls, PROP_KEY);
    const ownPropsWithMeta = ownPropMeta ? Reflect.ownKeys(ownPropMeta) : [];
    const ownMethodsWithParams = Reflector.getRawMeta(Cls, METHODS_WITH_PARAMS, undefined, new Set<string | symbol>());
    ownPropsWithMeta.forEach((prop) => ownMethodsWithParams.add(prop));

    const allClassMethods = Reflect.ownKeys(Cls.prototype).filter((prop) => {
      const descriptor = Object.getOwnPropertyDescriptor(Cls.prototype, prop);
      return typeof descriptor?.value == 'function';
    });

    Reflect.ownKeys(mergedClassMeta).forEach((propertyKey) => {
      if (propertyKey == 'constructor') return;
      if (allClassMethods.includes(propertyKey) && !ownMethodsWithParams.has(propertyKey)) {
        mergedClassMeta[propertyKey].params = this.collectParamMeta(Cls, propertyKey, Function);
      }
    });
  }

  protected static collectMetaChain<DecorValue = any, Proto extends AnyObj = AnyObj>(
    Cls: Class<Proto>,
  ): ClassMetaChain<DecorValue, Proto> | undefined {
    if (classMetaChainCache.has(Cls)) {
      return classMetaChainCache.get(Cls) as ClassMetaChain<DecorValue, Proto>;
    } else {
      // Build a fresh metadata view once, then cache it on the class constructor.
      // Parent metadata is copied first so own metadata can override or prepend it.
      const newClassMetaChain: ClassMetaChain<DecorValue, Proto> = new Map();
      const ParentCls = this.getParentClass(Cls);
      if (ParentCls) {
        // Merging current meta with parent meta
        this.collectMetaChain<DecorValue, Proto>(ParentCls)?.forEach((v, k) => newClassMetaChain.set(k, v));
      }
      newClassMetaChain.set(Cls, this.getClassMeta(Cls));
      classMetaChainCache.set(Cls, newClassMetaChain);
      return newClassMetaChain;
    }
  }

  protected static getParentClass(Cls: Class): Class | undefined {
    const parentClass = Object.getPrototypeOf(Cls.prototype).constructor;
    return parentClass == Object ? undefined : parentClass;
  }

  protected static getClassMeta<DecorValue = any, Proto extends AnyObj = object>(Cls: Class<Proto>) {
    const classMeta = new ClassMetaIterator() as ClassMeta<DecorValue, Proto>;

    // Setting metadata for a constructor is different from setting metadata for
    // other class properties. A constructor has a different metadata key,
    // a different strategy for getting parameters (taking inheritance into account), etc.
    classMeta.constructor = new ClassPropMeta(
      Function,
      this.getRawMeta(Cls, CLASS_KEY),
      this.collectParamMeta(Cls, 'constructor', Function),
    );

    // Get a list of unique class properties that have metadata.
    const ownPropsMeta = this.getRawMeta(Cls, PROP_KEY);
    const ownPropsWithMeta = ownPropsMeta ? Reflect.ownKeys(ownPropsMeta) : [];
    const ownMethodsWithParams = Reflector.getRawMeta(Cls, METHODS_WITH_PARAMS, undefined, new Set<string | symbol>());
    ownPropsWithMeta.forEach((p) => ownMethodsWithParams.add(p));
    ownMethodsWithParams.delete('constructor');

    ownMethodsWithParams.forEach((propertyKey) => {
      const type: Class = Reflect.getOwnMetadata('design:type', Cls.prototype, propertyKey);
      const decorators = ownPropsMeta ? ownPropsMeta[propertyKey] || [] : [];
      const params = this.collectParamMeta(Cls, propertyKey, type);
      (classMeta as any)[propertyKey] = new ClassPropMeta(type, decorators, params);
    });

    return classMeta;
  }

  /**
   * Returns array of parameters for given method.
   *
   * @param Cls A class that has decorators.
   * @param propertyKey If this method is called without `propertyKey`,
   * it's returns parameters of class constructor.
   */
  protected static collectParamMeta<T extends object>(
    Cls: Class<T>,
    propertyKey?: KeyOfClass<T>,
    propertyType?: any,
  ): (ParameterMeta | null)[] {
    if (propertyType && propertyType !== Function) {
      return [];
    } else if (!propertyType) {
      const descriptor = Object.getOwnPropertyDescriptor(Cls.prototype, propertyKey || 'constructor');
      if (typeof descriptor?.value != 'function') return [];
    }

    const isConstructor = !propertyKey || propertyKey == 'constructor';
    if (isConstructor && isDelegateCtor(Cls.toString())) {
      return this.collectParamMeta(this.getParentClass(Cls)!, propertyKey, propertyType);
    } else {
      const paramDecoratorMeta = isConstructor
        ? this.getRawMeta(Cls, PARAM_KEY)
        : this.getRawMeta(Cls, PARAM_KEY, propertyKey);
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
    paramTypes: Class[] | undefined,
    paramDecoratorMeta: (DecoratorAndValue[] | null)[] | undefined,
  ): ParameterMeta[] {
    let mergedParamMeta: ParameterItem[][];

    if (paramTypes) {
      mergedParamMeta = new Array(paramTypes.length);
    } else {
      mergedParamMeta = paramDecoratorMeta ? new Array(paramDecoratorMeta.length) : [];
    }

    for (let paramIndex = 0; paramIndex < mergedParamMeta.length; paramIndex++) {
      if (!paramTypes || paramTypes[paramIndex] === Object) {
        // TypeScript emit `Object` for types like `any`. Treat it as unknown
        // instead of using Object as an injection token.
        mergedParamMeta[paramIndex] = [];
      } else if (paramTypes?.[paramIndex]) {
        mergedParamMeta[paramIndex] = [paramTypes?.[paramIndex]] as [Class];
      }
      if (paramDecoratorMeta && paramDecoratorMeta[paramIndex] != null) {
        mergedParamMeta[paramIndex].push(...(paramDecoratorMeta[paramIndex] as DecoratorAndValue[]));
      }
    }
    return mergedParamMeta as ParameterMeta[];
  }

  protected static setDecoratorFactoryName(factory: AnyFn, debugFactoryName?: string) {
    if (debugFactoryName) {
      Object.defineProperty(factory, 'name', { value: debugFactoryName });
    }
  }

  protected static getClassMetaOrParamMeta<DecorValue = any, Proto extends object = object>(
    Cls: Class<Proto>,
    classMeta: MergedClassMeta<DecorValue, Proto> | undefined,
    propertyKey?: string | symbol,
  ): MergedClassMeta<DecorValue, Proto> | MergedClassPropMeta<DecorValue> | undefined {
    if (propertyKey) {
      const classPropMeta = classMeta?.[propertyKey as keyof Proto];
      if (classPropMeta) {
        return classPropMeta;
      } else {
        // The requested method/property may have no decorators at all. Return a synthetic
        // metadata object so callers can still inspect function.length based params.
        const params = this.collectParamMeta(Cls, propertyKey as KeyOfClass<Proto>);
        return new MergedClassPropMeta(UnknownType, [], params, new Map(), new Map([[Cls, params]]));
      }
    } else {
      return classMeta;
    }
  }
}
