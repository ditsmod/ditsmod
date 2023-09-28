import { GuardItem, HttpMethod, AnyFn, makePropDecorator } from '@ditsmod/core';
import { XOperationObject } from '@ts-stack/openapi-spec';

export interface OasRouteDecoratorMetadata<T = (OasRouteMetadata1 | OasRouteMetadata2)> {
  otherDecorators: any[];
  /**
   * Decorator value.
   */
  value: T;
  decorator: AnyFn;
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
  httpMethod: HttpMethod,
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

/**
 * Open API Specification Route.
 */
export const oasRoute = makePropDecorator(oasRouteCallback);
