import { InjectionToken } from '#di';

import { PathParam } from '#types/router.js';
import { HttpServer } from '#types/server-options.js';
import { AnyObj } from '#types/mix.js';
import { HttpRequest, HttpResponse } from '#types/server-options.js';

/**
 * A DI token that allows you to obtain the instance of the server that is serving the current application.
 */
export const SERVER = new InjectionToken<HttpServer>('SERVER');
/**
 * DI token for native webserver request.
 */
export const HTTP_REQ = new InjectionToken<HttpRequest>('HTTP_REQ');
/**
 * DI token for native webserver response.
 */
export const HTTP_RES = new InjectionToken<HttpResponse>('HTTP_RES');
/**
 * DI token for path params that is returned by `@ditsmod/routing`.
 */
export const A_PATH_PARAMS = new InjectionToken<PathParam[]>('A_PATH_PARAMS');
export const PATH_PARAMS = new InjectionToken<AnyObj>('PATH_PARAMS');
export const QUERY_PARAMS = new InjectionToken<AnyObj>('QUERY_PARAMS');
/**
 * DI token for querystring that is returned by `PreRouter` after spliting `httpReq.url` by question mark.
 */
export const QUERY_STRING = new InjectionToken<HttpRequest>('QUERY_STRING');
