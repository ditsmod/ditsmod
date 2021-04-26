import { XParameterObject } from '@ts-stack/openapi-spec';
import { edk } from '@ditsmod/core';
import { Type, reflector } from '@ts-stack/di';

import { SchemaDecoratorMetadata } from '../decorators/schema';

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
  required<T extends Type<edk.AnyObj>>(
    paramsIn: RequiredParamsIn,
    modelOrString: T | string,
    ...params: (KeyOf<T> | string)[]
  ) {
    return this.setParams(true, paramsIn, modelOrString, ...params);
  }

  optional<T extends Type<edk.AnyObj>>(paramsIn: OptionalParamsIn, model: T, ...params: KeysOf<T>): this;
  optional(paramsIn: OptionalParamsIn, ...params: [string, ...string[]]): this;
  optional<T extends Type<edk.AnyObj>>(
    paramsIn: OptionalParamsIn,
    modelOrString: T | string,
    ...params: (KeyOf<T> | string)[]
  ) {
    return this.setParams(false, paramsIn, modelOrString, ...params);
  }

  getParams() {
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
    const meta = reflector.propMetadata(model) as SchemaDecoratorMetadata;
    return paramsObjects.map((paramObject) => {
      const schemaDecoratorValue = meta[paramObject.name];
      if (schemaDecoratorValue) {
        paramObject.schema = Object.assign({}, ...schemaDecoratorValue.slice(1), paramObject.schema);
      }
      return paramObject;
    });
  }
}
