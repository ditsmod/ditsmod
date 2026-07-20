import type { Class, HttpMethod } from '@ditsmod/core';
import { Reflector } from '@ditsmod/core';
import type { GuardItem, HttpInterceptor } from '@ditsmod/rest';
import type { XOperationObject } from '@ts-stack/openapi-spec';

/**
 * This route metadata has a `guards` property.
 */
export interface OasRouteMeta {
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
): OasRouteMeta {
  if (operationObject) {
    return {
      httpMethod,
      path: path || '',
      guards: (guardsOrOperationObj || []) as GuardItem[],
      interceptors: (interceptorsOrOperationObj || []) as Class<HttpInterceptor>[],
      operationObject: operationObject || {},
    } satisfies OasRouteMeta;
  } else if (Array.isArray(interceptorsOrOperationObj)) {
    return {
      httpMethod,
      path: path || '',
      guards: (guardsOrOperationObj || []) as GuardItem[],
      interceptors: interceptorsOrOperationObj,
      operationObject: {},
    } satisfies OasRouteMeta;
  } else if (interceptorsOrOperationObj) {
    return {
      httpMethod,
      path: path || '',
      guards: (guardsOrOperationObj || []) as GuardItem[],
      operationObject: interceptorsOrOperationObj,
      interceptors: [],
    } satisfies OasRouteMeta;
  } else if (Array.isArray(guardsOrOperationObj)) {
    return {
      httpMethod,
      path: path || '',
      guards: guardsOrOperationObj,
      operationObject: {},
      interceptors: [],
    } satisfies OasRouteMeta;
  } else {
    return {
      httpMethod,
      path: path || '',
      operationObject: guardsOrOperationObj || {},
      guards: [],
      interceptors: [],
    } satisfies OasRouteMeta;
  }
}

/**
 * Open API Specification Route.
 */
export const oasRoute: OasRouteOptions = Reflector.makePropDecorator(oasRouteCallback, 'oasRoute');

interface OasRouteOptions {
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
