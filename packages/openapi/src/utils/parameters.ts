import { SchemaObjectType, XParameterObject, XSchemaObject } from '@ts-stack/openapi-spec';
import { edk, HttpMethod } from '@ditsmod/core';
import { Type, reflector } from '@ts-stack/di';

import { ColumnDecoratorMetadata } from '../decorators/column';
import { isColumn } from './type-guards';

type RequiredParamsIn = 'query' | 'header' | 'path' | 'cookie';
type OptionalParamsIn = 'query' | 'header' | 'cookie';
type KeyOf<T extends Type<edk.AnyObj>> = Extract<keyof T['prototype'], string>;
type KeysOf<T extends Type<edk.AnyObj>> = [KeyOf<T>, ...KeyOf<T>[]];
/**
 * Applies to importing `ModuleWithParams`. OAS parameter's property, indicates the parameter
 * should be recursively added to imported modules.
 */
export const RECURSIVE_PARAM = 'x-recursive';
/**
 * Applies to importing `ModuleWithParams`. OAS parameter's property, indicates the parameter
 * should or not be bound to presence last param in a route path.
 */
export const BOUND_TO_PATH_PARAM = 'x-bound-to-path-param';
/**
 * Applies to importing `ModuleWithParams`. OAS parameter's property, indicates the parameter
 * should or not be bound to HTTP method in a route path.
 */
export const BOUND_TO_HTTP_METHOD = 'x-bound-to-http-method';
/**
 * Helper for OpenAPI `ParameterObject`s.
 */
export class Parameters {
  protected parameters: XParameterObject[] = [];
  protected countOfLastPushedParams: number;

  // prettier-ignore
  required<T extends Type<edk.AnyObj>>(paramsIn: RequiredParamsIn, model: T, ...params: KeysOf<T>): this;
  // prettier-ignore
  required(paramsIn: RequiredParamsIn, ...params: [string, ...string[]]): this;
  // prettier-ignore
  required<T extends Type<edk.AnyObj>>(paramsIn: RequiredParamsIn, modelOrString: T | string, ...params: (KeyOf<T> | string)[]) {
    return this.setParams(true, paramsIn, modelOrString, ...params);
  }

  // prettier-ignore
  optional<T extends Type<edk.AnyObj>>(paramsIn: OptionalParamsIn, model: T, ...params: KeysOf<T>): this;
  // prettier-ignore
  optional(paramsIn: OptionalParamsIn, ...params: [string, ...string[]]): this;
  // prettier-ignore
  optional<T extends Type<edk.AnyObj>>(paramsIn: OptionalParamsIn, modelOrString: T | string, ...params: (KeyOf<T> | string)[]
  ) {
    return this.setParams(false, paramsIn, modelOrString, ...params);
  }

  getParams(): XParameterObject[];
  // prettier-ignore
  getParams<T extends Type<edk.AnyObj>>(paramsIn: 'path', isRequired: true, model: T, ...params: KeysOf<T>): XParameterObject[];
  // prettier-ignore
  getParams<T extends Type<edk.AnyObj>>(paramsIn: OptionalParamsIn, isRequired: boolean, model: T, ...params: KeysOf<T>): XParameterObject[];
  // prettier-ignore
  getParams(paramsIn: OptionalParamsIn, isRequired: boolean, ...params: [string, ...string[]]): XParameterObject[];
  // prettier-ignore
  getParams<T extends Type<edk.AnyObj>>(paramsIn?: RequiredParamsIn, isRequired?: boolean, modelOrString?: T | string, ...params: (KeyOf<T> | string)[]): XParameterObject[] {
    if (isRequired !== undefined) {
      this.setParams(isRequired, paramsIn, modelOrString, ...params);
    }
    return [...this.parameters];
  }

  /**
   * Applies to importing `ModuleWithParams`. Indicates the parameters that were added in the
   * previous step as recursive.
   *
   * For example, if you first called `optional()` or `required()` with 2 parameters
   * and then called `recursive()`, these 2 parameters will be marked recursive.
   *
   * @param depth Positive number of recursiveness: `1`, `2`, `3`... - number depth of recursion.
   * Default `depth == 100` (like "unlimeted").
   */
  recursive(depth: number = 100) {
    const params = this.getLastAddedParams();
    params.forEach((param) => (param[RECURSIVE_PARAM] = depth));
    return this;
  }

  /**
   * Applies to importing `ModuleWithParams`. Indicates the parameters that were added in the
   * previous step as bound to existence param in a route path.
   *
   * For example, if you first called `optional()` or `required()` with 2 parameters
   * and then called `bindTo('lastParamInPath', true)`, these 2 parameters will be marked as bound
   * to `posts/:postId`. In case `:postId` exists - parameters works.
   *
   * If you calls `bindTo('lastParamInPath')` (without last argument), and if in path param not
   * exists, parameters works too.
   */
  bindTo(to: 'lastParamInPath', ifExists?: boolean): this;
  /**
   * Applies to importing `ModuleWithParams`. Indicates the parameters that were added in the
   * previous step as bound to HTTP method in a route.
   *
   * For example, if you first called `optional()` or `required()` with 2 parameters
   * and then called `bindTo('httpMethod', 'GET')`, these 2 parameters will be marked as bound
   * to `GET` method. So, these parameters works only if you have request with `GET` method.
   */
  bindTo(to: 'httpMethod', httpMethod: HttpMethod): this;
  bindTo(to: 'lastParamInPath' | 'httpMethod', options: any = false) {
    const params = this.getLastAddedParams();
    const key = to == 'httpMethod' ? BOUND_TO_HTTP_METHOD : BOUND_TO_PATH_PARAM;
    params.forEach((param) => (param[key] = options));
    return this;
  }

  protected getLastAddedParams() {
    if (!this.countOfLastPushedParams) {
      throw new Error('You can not add recursiveness to non-exists parameter');
    }
    return this.parameters.slice(-this.countOfLastPushedParams);
  }

  protected setParams<T extends Type<edk.AnyObj>>(
    isRequired: boolean,
    paramsIn: RequiredParamsIn,
    modelOrString: T | string,
    ...params: (KeyOf<T> | string)[]
  ) {
    let paramsObjects: XParameterObject[];
    if (typeof modelOrString == 'string') {
      params.unshift(modelOrString);
      paramsObjects = this.transformParams(params, paramsIn, isRequired);
    } else {
      paramsObjects = this.transformParams(params, paramsIn, isRequired);
      paramsObjects = this.setMetadata(modelOrString, paramsObjects);
    }

    this.parameters.push(...paramsObjects);
    this.countOfLastPushedParams = paramsObjects.length;
    return this;
  }

  protected transformParams(params: string[], paramsIn: RequiredParamsIn, isRequired?: boolean) {
    return params.map<XParameterObject>((param) => {
      return { in: paramsIn, name: param as string, required: isRequired };
    });
  }

  /**
   * Sets metadata from a model to parameters.
   */
  protected setMetadata(model: Type<any>, paramsObjects: XParameterObject[]): XParameterObject[] {
    const meta = reflector.propMetadata(model) as ColumnDecoratorMetadata;
    return paramsObjects.map((paramObject) => {
      const propertyDecorator = meta[paramObject.name];
      if (propertyDecorator) {
        const propertyType = propertyDecorator[0];
        const schema = propertyDecorator.filter(isColumn);
        paramObject.schema = Object.assign({}, ...schema, paramObject.schema);
        this.setColumnType(paramObject.schema, propertyType);
      }
      return paramObject;
    });
  }

  protected setColumnType(schema: XSchemaObject, propertyType: Type<edk.AnyObj>) {
    if (schema.type === undefined) {
      if ([Boolean, Number, String, Array, Object].includes(propertyType as any)) {
        schema.type = (propertyType.name?.toLowerCase() || 'null') as SchemaObjectType;
      } else if (propertyType instanceof Type) {
        schema.type = 'object';
      } else {
        schema.type = 'null';
      }
    }
  }
}

// prettier-ignore
export function getParams<T extends Type<edk.AnyObj>>(paramsIn: 'path', isRequired: true, model: T, ...params: KeysOf<T>): XParameterObject[];
// prettier-ignore
export function getParams<T extends Type<edk.AnyObj>>(paramsIn: OptionalParamsIn, isRequired: boolean, model: T, ...params: KeysOf<T>): XParameterObject[];
// prettier-ignore
export function getParams(paramsIn: OptionalParamsIn, isRequired: boolean, ...params: [string, ...string[]]): XParameterObject[];
// prettier-ignore
export function getParams<T extends Type<edk.AnyObj>>(paramsIn?: any, isRequired?: boolean, modelOrString?: any, ...params: (KeyOf<T> | string)[]
) {
  return new Parameters().getParams(paramsIn, isRequired, modelOrString, ...params);
}
