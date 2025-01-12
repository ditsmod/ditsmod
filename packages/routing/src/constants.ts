import { InjectionToken, Extension, AnyObj } from '@ditsmod/core';

import { HttpInterceptor } from './interceptors/tokens-and-types.js';
import { MetadataPerMod3 } from './types.js';
import { RawRequest, RawResponse } from './request.js';
import { PathParam } from './router.js';
import { HttpServer } from './server-options.js';

export const HTTP_INTERCEPTORS = new InjectionToken<HttpInterceptor[]>('HTTP_INTERCEPTORS');
/**
 * A group of extensions that setting routes for router.
 */
export const PRE_ROUTER_EXTENSIONS = new InjectionToken<Extension<void>[]>('PRE_ROUTER_EXTENSIONS');
/**
 * A group of extensions that returns `MetadataPerMod3[]` for a router.
 */
export const ROUTE_EXTENSIONS = new InjectionToken<Extension<MetadataPerMod3>[]>('ROUTE_EXTENSIONS');
/**
 * A group of extensions that allows you to set the order of launching different interceptors.
 */
export const USE_INTERCEPTOR_EXTENSIONS = new InjectionToken<Extension[]>('USE_INTERCEPTOR_EXTENSIONS');

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
