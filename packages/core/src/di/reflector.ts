import { AnyObj } from '#types/mix.js';
import { TypeGuard } from '#utils/type-guards.js';
import { ClassMetaIterator, init } from './class-meta-iterator.js';
import {
  CACHE_KEY,
  CLASS_KEY,
  DEPS_KEY,
  PARAMS_KEY,
  METHODS_WITH_PARAMS,
  PROP_KEY,
  getParamKey,
  getRawMetadata,
} from './decorator-factories.js';
import { Class, DecoratorAndValue, ParamsMeta, ClassMeta, ClassPropMeta, UnknownType } from './types-and-models.js';
import { isType, newArray } from './utils.js';

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
  private reflect: typeof Reflect;

  constructor(reflect?: typeof Reflect) {
    this.reflect = reflect || Reflect;
  }

  /**
   * @param Cls The class from which to return the metadata.
   * @param typeGuard Type guard, which will search for necessary decorators.
   * @returns Returns an array of `DecoratorAndValue` for the passed `Cls`, using the passed `typeGuard`,
   * or `undefined` if no appropriate decorators.
   */
  getDecorators<T extends DecoratorAndValue>(Cls: Class, typeGuard: TypeGuard<T>): T[] | undefined;
  /**
   * @param Cls The class from which to return the metadata.
   * @param typeGuard Type guard, which will search for necessary decorators.
   * @returns Returns an array of `DecoratorAndValue` for the passed `Cls`,
   * or `undefined` if no appropriate decorators.
   */
  getDecorators<T = any>(Cls: Class): DecoratorAndValue<T>[] | undefined;
  getDecorators<T extends DecoratorAndValue>(Cls: Class, typeGuard?: TypeGuard<T>) {
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
  getMetadata<DecorValue = any, Proto extends AnyObj = AnyObj>(
    Cls: Class<Proto>,
  ): ClassMeta<DecorValue, Proto> | undefined;
  /**
   * Returns the metadata for the constructor or methods of the passed class.
   *
   * @param Cls A class that has decorators.
   */
  getMetadata<DecorValue = any, Proto extends AnyObj = AnyObj>(
    Cls: Class<Proto>,
    propertyKey?: keyof Proto | 'constructor' | symbol,
  ): ClassPropMeta<DecorValue> | undefined;
  getMetadata<DecorValue = any, Proto extends AnyObj = AnyObj>(
    Cls: Class<Proto>,
    propertyKey?: string | symbol,
  ): ClassMeta<DecorValue, Proto> | ClassPropMeta<DecorValue> | undefined {
    const classMeta = new ClassMetaIterator() as unknown as ClassMeta<DecorValue, Proto>;
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
      if (cache) {
        (cache as unknown as ClassMetaIterator)[init]();
      }
    }

    return this.getClassMetaOrParamsMeta(Cls, cache!, propertyKey);
  }

  protected getClassMetaOrParamsMeta<DecorValue = any, Proto extends object = object>(
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

  protected concatWithParentClassMeta<DecorValue = any, Proto extends AnyObj = object>(
    Cls: Class<Proto>,
    classMeta: ClassMeta<DecorValue, Proto>,
  ) {
    const parentClass = this.getParentClass(Cls);
    if (parentClass !== Object) {
      const parentPropMeta = this.getMetadata(parentClass);
      // Merging current meta with parent meta
      if (parentPropMeta) {
        this.reflect.ownKeys(parentPropMeta).forEach((propName) => {
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

  protected concatWithOwnClassMeta<DecorValue = any, Proto extends AnyObj = object>(
    Cls: Class<Proto>,
    classMeta: ClassMeta<DecorValue, Proto>,
  ) {
    const ownPropMetadata = this.getOwnPropMetadata(Cls);
    let ownMetaKeys: (string | symbol)[] = [];
    if (ownPropMetadata) {
      ownMetaKeys = this.reflect.ownKeys(ownPropMetadata);
    }
    ownMetaKeys.forEach((propName) => {
      const type = this.reflect.getOwnMetadata('design:type', Cls.prototype, propName);
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

  protected concatWithParamsMeta<DecorValue = any, Proto extends AnyObj = object>(
    Cls: Class<Proto>,
    classMeta: ClassMeta<DecorValue, Proto>,
    ownMetaKeys: (string | symbol)[],
  ): ClassMeta<DecorValue, Proto> | undefined {
    const methodNames = getRawMetadata(Cls, METHODS_WITH_PARAMS, new Set());
    methodNames.add('constructor');
    methodNames.forEach((propName: any) => {
      if (ownMetaKeys.includes(propName)) {
        return;
      }
      if (!classMeta.hasOwnProperty(propName)) {
        (classMeta as any)[propName] = { type: Function, decorators: [], params: [] } as ClassPropMeta;
      }
      const classPropMeta = (classMeta as any)[propName] as ClassPropMeta;
      classPropMeta.params = this.getParamsMetadata(Cls, propName as any);
      delete (classPropMeta as any)[DEPS_KEY];
      if (propName == 'constructor') {
        classPropMeta.decorators = this.getClassMetadata(Cls);
      }
    });

    if (
      this.reflect.ownKeys(classMeta).length == 1 &&
      !classMeta.constructor.decorators.length &&
      !classMeta.constructor.params.length
    ) {
      this.setMetaCache(Cls, CACHE_KEY, undefined);
      return;
    }

    this.setMetaCache(Cls, CACHE_KEY, classMeta);
    return classMeta;
  }

  protected setMetaCache<DecorValue = any, Proto extends AnyObj = object>(
    Cls: Class<Proto>,
    key: string | symbol,
    classMeta?: ClassMeta<DecorValue, Proto>,
  ) {
    // Use of Object.defineProperty is important since it creates non-enumerable property which
    // prevents the property is copied during subclassing.
    if (Cls.hasOwnProperty(key)) {
      (Cls as any)[key] = classMeta;
    } else {
      Object.defineProperty(Cls, key, { value: classMeta, writable: true });
    }
  }

  protected getOwnCacheMetadata<DecorValue = any, Proto extends object = object>(Cls: any) {
    if (Cls.hasOwnProperty(CACHE_KEY)) {
      return Cls[CACHE_KEY] as ClassMeta<DecorValue, Proto> | undefined;
    }
    return null;
  }

  /**
   * Returns the metadata for passed class.
   *
   * @param Cls A class that has decorators.
   */
  protected getClassMetadata<T = any>(Cls: Class): DecoratorAndValue<T>[] {
    if (!isType(Cls)) {
      return [];
    }
    const parentClass = this.getParentClass(Cls);
    const ownClassAnnotations = this.getOwnClassAnnotations(Cls) || [];
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
  protected getParamsMetadata<T extends object>(
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

  protected getParentClass(ctor: Class): Class {
    const parentProto = ctor.prototype ? Object.getPrototypeOf(ctor.prototype) : null;
    const parentClass = parentProto ? parentProto.constructor : null;
    // Note: We always use `Object` as the null value
    // to simplify checking later on.
    return parentClass || Object;
  }

  protected mergeTypesAndClassMeta(paramTypes: any[], paramMetadata: any[]): ParamsMeta[] {
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

  protected getOwnParams(Cls: Class, propertyKey?: string | symbol): ParamsMeta[] | null[] {
    const isConstructor = !propertyKey || propertyKey == 'constructor';
    const key = isConstructor ? getParamKey(PARAMS_KEY) : getParamKey(PARAMS_KEY, propertyKey);
    const paramMetadata = Cls.hasOwnProperty(key) && (Cls as any)[key];
    const args = (isConstructor ? [Cls] : [Cls.prototype, propertyKey]) as [Class];
    const paramTypes = this.reflect.getOwnMetadata('design:paramtypes', ...args);

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

  protected getOwnClassAnnotations(Cls: Class): any[] | null {
    // API for metadata created by invoking the decorators.
    if (Cls.hasOwnProperty(CLASS_KEY)) {
      return (Cls as any)[CLASS_KEY];
    }
    return null;
  }

  protected getOwnPropMetadata(Cls: any): { [key: string | symbol]: any[] } | null {
    // API for metadata created by invoking the decorators.
    if (Cls.hasOwnProperty(PROP_KEY)) {
      return Cls[PROP_KEY];
    }
    return null;
  }
}
