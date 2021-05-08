import { edk, GuardItem, HttpMethod } from '@ditsmod/core';
import { makePropDecorator } from '@ts-stack/di';
import { XOperationObject } from '@ts-stack/openapi-spec';

export type OasRouteDecorator = <T>(
  target: edk.AnyObj,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<T>
) => OasRouteDecoratorMetadata;

export interface OasRouteDecoratorMetadata {
  [key: string]: (OasRouteMetadata1 | OasRouteMetadata2)[];
}

export interface OasRouteMetadata1 {
  httpMethod: HttpMethod;
  path?: string;
  guards?: GuardItem[];
  /**
   * OAS `OperationObject`.
   */
  operationObject?: XOperationObject;
}

export interface OasRouteMetadata2 {
  httpMethod: HttpMethod;
  path?: string;
  /**
   * OAS `OperationObject`.
   */
  operationObject?: XOperationObject;
}

function oasRouteCallback(
  httpMethod?: HttpMethod,
  path?: string,
  guardsOrOperationObj?: XOperationObject | GuardItem[],
  operationObject?: XOperationObject
): OasRouteMetadata1 | OasRouteMetadata2 {
  if (Array.isArray(guardsOrOperationObj)) {
    return { httpMethod, path, guards: guardsOrOperationObj, operationObject };
  } else if (guardsOrOperationObj) {
    return { httpMethod, path, operationObject: guardsOrOperationObj };
  } else {
    return { httpMethod, path };
  }
}

// prettier-ignore
declare function oasRoute(httpMethod: HttpMethod, path?: string, guards?: GuardItem[], operationObject?: XOperationObject): OasRouteDecorator;
// prettier-ignore
declare function oasRoute(httpMethod: HttpMethod, path?: string, operationObject?: XOperationObject): OasRouteDecorator;

/**
 * Open API Specification Route.
 */
export const OasRoute = makePropDecorator('OasRoute', oasRouteCallback) as typeof oasRoute;
