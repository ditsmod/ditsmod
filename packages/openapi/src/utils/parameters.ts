import { SchemaObjectType, XParameterObject, XSchemaObject } from '@ts-stack/openapi-spec';
import { edk } from '@ditsmod/core';
import { Type, reflector } from '@ts-stack/di';

import { ColumnDecoratorMetadata } from '../decorators/column';
import { isColumn } from './type-guards';

type RequiredParamsIn = 'query' | 'header' | 'path' | 'cookie';
type OptionalParamsIn = 'query' | 'header' | 'cookie';
type KeyOf<T extends Type<edk.AnyObj>> = Extract<keyof T['prototype'], string>;
type KeysOf<T extends Type<edk.AnyObj>> = [KeyOf<T>, ...KeyOf<T>[]];
/**
 * Helper for OpenAPI `ParameterObject`s.
 */
export class Parameters {
  protected parameters: XParameterObject[] = [];

  required<T extends Type<edk.AnyObj>>(paramsIn: RequiredParamsIn, model: T, ...params: KeysOf<T>): this;
  required(paramsIn: RequiredParamsIn, ...params: [string, ...string[]]): this;
  required<T extends Type<edk.AnyObj>>(paramsIn: RequiredParamsIn, modelOrString: T | string, ...params: (KeyOf<T> | string)[]) {
    return this.setParams(true, paramsIn, modelOrString, ...params);
  }

  optional<T extends Type<edk.AnyObj>>(paramsIn: OptionalParamsIn, model: T, ...params: KeysOf<T>): this;
  optional(paramsIn: OptionalParamsIn, ...params: [string, ...string[]]): this;
  optional<T extends Type<edk.AnyObj>>(paramsIn: OptionalParamsIn, modelOrString: T | string, ...params: (KeyOf<T> | string)[]
  ) {
    return this.setParams(false, paramsIn, modelOrString, ...params);
  }

  getParams(): XParameterObject[];
  getParams<T extends Type<edk.AnyObj>>(paramsIn: 'path', isRequired: true, model: T, ...params: KeysOf<T>): XParameterObject[];
  getParams<T extends Type<edk.AnyObj>>(paramsIn: OptionalParamsIn, isRequired: boolean, model: T, ...params: KeysOf<T>): XParameterObject[];
  getParams(paramsIn: OptionalParamsIn, isRequired: boolean, ...params: [string, ...string[]]): XParameterObject[];
  getParams<T extends Type<edk.AnyObj>>(paramsIn?: RequiredParamsIn, isRequired?: boolean, modelOrString?: T | string, ...params: (KeyOf<T> | string)[]): XParameterObject[] {
    if (isRequired !== undefined) {
      this.setParams(isRequired, paramsIn, modelOrString, ...params);
    }
    return [...this.parameters];
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

export function getParams<T extends Type<edk.AnyObj>>(paramsIn: 'path', isRequired: true, model: T, ...params: KeysOf<T>): XParameterObject[];
export function getParams<T extends Type<edk.AnyObj>>(paramsIn: OptionalParamsIn, isRequired: boolean, model: T, ...params: KeysOf<T>): XParameterObject[];
export function getParams(paramsIn: OptionalParamsIn, isRequired: boolean, ...params: [string, ...string[]]): XParameterObject[];
export function getParams<T extends Type<edk.AnyObj>>(paramsIn?: any, isRequired?: boolean, modelOrString?: any, ...params: (KeyOf<T> | string)[]
) {
  return new Parameters().getParams(paramsIn, isRequired, modelOrString, ...params);
}
