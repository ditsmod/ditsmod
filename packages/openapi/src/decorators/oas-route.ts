import { GuardItem, HttpMethod, makePropDecorator } from '@ditsmod/core';
import { XOperationObject } from '@ts-stack/openapi-spec';

/**
 * This route metadata has a `guards` property.
 */
export interface OasRouteMetadata1 {
  httpMethod: HttpMethod | HttpMethod[];
  path?: string;
  guards?: GuardItem[];
  /**
   * OAS `OperationObject`.
   */
  operationObject?: XOperationObject;
}

/**
 * This route metadata does not have a `guards` property.
 */
export interface OasRouteMetadata2 {
  httpMethod: HttpMethod | HttpMethod[];
  path?: string;
  /**
   * OAS `OperationObject`.
   */
  operationObject?: XOperationObject;
}

function oasRouteCallback(
  httpMethod: HttpMethod | HttpMethod[],
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
