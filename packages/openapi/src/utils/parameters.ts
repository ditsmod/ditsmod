import { XParameterObject } from '@ts-stack/openapi-spec';
import { edk } from '@ditsmod/core';
import { Type, reflector } from '@ts-stack/di';

type RequiredParamIn = 'query' | 'header' | 'path' | 'cookie';
type OptionalParamIn = 'query' | 'header' | 'cookie';
type KeyOf<T extends Type<edk.AnyObj>> = keyof T['prototype'];
type KeysOf<T extends Type<edk.AnyObj>> = [KeyOf<T>, ...KeyOf<T>[]];
/**
 * Helper for OpenAPI `ParameterObject`s.
 */
export class Parameters {
  protected parameters: XParameterObject[] = [];

  required<T extends Type<edk.AnyObj>>(paramIn: RequiredParamIn, model: T, ...params: KeysOf<T>): this;
  required(paramIn: RequiredParamIn, ...params: [string, ...string[]]): this;
  required<T extends Type<edk.AnyObj>>(paramIn: RequiredParamIn, modelOrString: T | string, ...params: (KeyOf<T> | string)[]) {
    if (typeof modelOrString == 'string') {
      params.unshift(modelOrString);
    } else {
      const meta = reflector.propMetadata(modelOrString);
    }

    const arr = params.map<XParameterObject>((param) => {
      return { in: paramIn, name: param as string, required: true };
    });
    this.parameters.push(...arr);
    return this;
  }

  optional<T extends Type<edk.AnyObj>>(paramIn: OptionalParamIn, model: T, ...params: KeysOf<T>): this;
  optional(paramIn: OptionalParamIn, ...params: [string, ...string[]]): this;
  optional<T extends Type<edk.AnyObj>>(paramIn: OptionalParamIn, modelOrString: T | string, ...params: (KeyOf<T> | string)[]) {
    if (typeof modelOrString == 'string') {
      params.unshift(modelOrString);
    } else {
      const meta = reflector.propMetadata(modelOrString);
    }

    const arr = params.map<XParameterObject>((param) => {
      return { in: paramIn, name: param as string };
    });
    this.parameters.push(...arr);
    return this;
  }

  getParams() {
    return [...this.parameters];
  }
}
