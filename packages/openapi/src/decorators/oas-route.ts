import { Class, HttpMethod, makePropDecorator } from '@ditsmod/core';
import { GuardItem, HttpInterceptor } from '@ditsmod/rest';
import { XOperationObject } from '@ts-stack/openapi-spec';

/**
 * This route metadata has a `guards` property.
 */
export interface OasRouteMetadata {
  httpMethod: HttpMethod | [HttpMethod, ...HttpMethod[]];
  path: string;
  guards: GuardItem[];
  interceptors: Class<HttpInterceptor>[];
  /**
   * OAS `OperationObject`.
   */
  operationObject: XOperationObject;
}

function oasRouteCallback(
  httpMethod: HttpMethod | [HttpMethod, ...HttpMethod[]],
  path?: string,
  guardsOrOperationObj?: XOperationObject | GuardItem[],
  interceptorsOrOperationObj?: XOperationObject | Class<HttpInterceptor>[],
  operationObject?: XOperationObject,
): OasRouteMetadata {
  if (operationObject) {
    return {
      httpMethod,
      path: path || '',
      guards: (guardsOrOperationObj || []) as GuardItem[],
      interceptors: (interceptorsOrOperationObj || []) as Class<HttpInterceptor>[],
      operationObject: operationObject || {},
    } satisfies OasRouteMetadata;
  } else if (Array.isArray(interceptorsOrOperationObj)) {
    return {
      httpMethod,
      path: path || '',
      guards: (guardsOrOperationObj || []) as GuardItem[],
      interceptors: interceptorsOrOperationObj,
      operationObject: {},
    } satisfies OasRouteMetadata;
  } else if (interceptorsOrOperationObj) {
    return {
      httpMethod,
      path: path || '',
      guards: (guardsOrOperationObj || []) as GuardItem[],
      operationObject: interceptorsOrOperationObj,
      interceptors: [],
    } satisfies OasRouteMetadata;
  } else if (Array.isArray(guardsOrOperationObj)) {
    return {
      httpMethod,
      path: path || '',
      guards: guardsOrOperationObj,
      operationObject: {},
      interceptors: [],
    } satisfies OasRouteMetadata;
  } else {
    return {
      httpMethod,
      path: path || '',
      operationObject: guardsOrOperationObj || {},
      guards: [],
      interceptors: [],
    } satisfies OasRouteMetadata;
  }
}

/**
 * Open API Specification Route.
 */
export const oasRoute: OasRouteInterface = makePropDecorator(oasRouteCallback, 'oasRoute');

interface OasRouteInterface {
  (
    httpMethod: HttpMethod | [HttpMethod, ...HttpMethod[]],
    path: string,
    guards: GuardItem[],
    interceptors: Class<HttpInterceptor>[],
    operationObject: XOperationObject,
  ): any;
  (
    httpMethod: HttpMethod | [HttpMethod, ...HttpMethod[]],
    path: string,
    guards: GuardItem[],
    interceptorsOrOperationObj?: XOperationObject | Class<HttpInterceptor>[],
  ): any;
  (
    httpMethod: HttpMethod | [HttpMethod, ...HttpMethod[]],
    path?: string,
    guardsOrOperationObj?: XOperationObject | GuardItem[],
  ): any;
}
