import { InjectionToken, AnyObj } from '@ditsmod/core';

import { HttpInterceptor } from './interceptors/tokens-and-types.js';
import { RawRequest, RawResponse } from './request.js';
import { PathParam } from './router.js';
import { HttpServer } from './server-options.js';

export const HTTP_INTERCEPTORS = new InjectionToken<HttpInterceptor[]>('HTTP_INTERCEPTORS');
/**
 * DI token for native webserver request.
 */
export const RAW_REQ = new InjectionToken<RawRequest>('RAW_REQ');
/**
 * DI token for native webserver response.
 */
export const RAW_RES = new InjectionToken<RawResponse>('RAW_RES');

/**
 * DI token for path params that is returned by `@ditsmod/routing`.
 */
export const A_PATH_PARAMS = new InjectionToken<PathParam[]>('A_PATH_PARAMS');
export const PATH_PARAMS = new InjectionToken<AnyObj>('PATH_PARAMS');
export const QUERY_PARAMS = new InjectionToken<AnyObj>('QUERY_PARAMS');
/**
 * DI token for querystring that is returned by `PreRouter` after spliting `rawReq.url` by question mark.
 */
export const QUERY_STRING = new InjectionToken<RawRequest>('QUERY_STRING');

/**
 * A DI token that allows you to obtain the instance of the server that is serving the current application.
 */
export const SERVER = new InjectionToken<HttpServer>('SERVER');
