import { CLASS_KEY, PARAMS_KEY, PROP_KEY, getParamKey } from './decorator-factories.js';
import { Class, DecoratorAndValue, ParamsMeta, ClassMeta, ClassPropMeta } from './types-and-models.js';
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
   * Returns all the metadata for the passed class.
   *
   * @param Cls A class that has decorators.
   */
  getMetadata<DecorValue = any, Proto extends object = object>(
    Cls: Class<Proto>,
  ): ClassMeta<DecorValue, Proto> | undefined {
    const propMetadata = {} as ClassMeta<DecorValue, Proto>;
    if (!isType(Cls)) {
      return;
    }
    const parentClass = this.getParentClass(Cls);
    if (parentClass !== Object) {
      const parentPropMetadata = this.getMetadata(parentClass);
      // Merging current meta with parent meta
      if (parentPropMetadata)
        Object.keys(parentPropMetadata).forEach((propName) => {
          (propMetadata as any)[propName] = parentPropMetadata[propName];
        });
    }
    const ownPropMetadata = this.getOwnPropMetadata(Cls);
    let ownMetaKeys: string[] = [];
    if (ownPropMetadata) {
      ownMetaKeys = Object.keys(ownPropMetadata);
    }
    ownMetaKeys.forEach((propName) => {
      const type = this.reflect.getOwnMetadata('design:type', Cls.prototype, propName);
      const decorators = ownPropMetadata![propName];
      if (propMetadata.hasOwnProperty(propName)) {
        const parentPropProto = (propMetadata as any)[propName] as ClassPropMeta;
        parentPropProto.type = type; // Override parent type.
        parentPropProto.decorators = [...decorators, ...parentPropProto.decorators];
      } else {
        (propMetadata as any)[propName] = { type, decorators, params: [] } as ClassPropMeta;
      }

      if ((propMetadata as any)[propName].type === Function) {
        const propProto = (propMetadata as any)[propName] as ClassPropMeta;
        propProto.params = this.getParamsMetadata(Cls, propName as any);
      }
    });

    if (Cls.prototype) {
      this.reflect.ownKeys(Cls.prototype).forEach((propName: any) => {
        const descriptor = Object.getOwnPropertyDescriptor(Cls.prototype, propName);
        if (ownMetaKeys.includes(propName) || typeof descriptor?.value != 'function') {
          return;
        }

        if (!propMetadata.hasOwnProperty(propName)) {
          (propMetadata as any)[propName] = { type: Function, decorators: [], params: [] } as ClassPropMeta;
        }
        const propProto = (propMetadata as any)[propName] as ClassPropMeta;
        propProto.params = this.getParamsMetadata(Cls, propName as any);
        if (propName == 'constructor') {
          propProto.decorators = this.getClassMetadata(Cls);
        }
      });
    }

    if (
      Object.keys(propMetadata).length == 1 &&
      !propMetadata.constructor.decorators.length &&
      !propMetadata.constructor.params.length
    ) {
      return;
    }

    return propMetadata;
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
  getParamsMetadata<T extends object>(Cls: Class<T>, propertyKey?: Exclude<keyof T, number>): (ParamsMeta | null)[] {
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

  private getParentClass(ctor: Class): Class {
    const parentProto = ctor.prototype ? Object.getPrototypeOf(ctor.prototype) : null;
    const parentClass = parentProto ? parentProto.constructor : null;
    // Note: We always use `Object` as the null value
    // to simplify checking later on.
    return parentClass || Object;
  }

  private mergeTypesAndClassMeta(paramTypes: any[], paramMetadata: any[]): ParamsMeta[] {
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

  private getOwnParams(Cls: Class, propertyKey?: string | symbol): ParamsMeta[] | null[] {
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

  private getOwnClassAnnotations(typeOrFunc: Class): any[] | null {
    // API for metadata created by invoking the decorators.
    if (typeOrFunc.hasOwnProperty(CLASS_KEY)) {
      return (typeOrFunc as any)[CLASS_KEY];
    }
    return null;
  }

  private getOwnPropMetadata(typeOrFunc: any): { [key: string]: any[] } | null {
    // API for metadata created by invoking the decorators.
    if (typeOrFunc.hasOwnProperty(PROP_KEY)) {
      return (typeOrFunc as any)[PROP_KEY];
    }
    return null;
  }
}
