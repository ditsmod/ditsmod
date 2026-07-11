import type { AnyObj } from '@ditsmod/core';
import { createInjectionSymbol, InjectionToken } from '@ditsmod/core';

import type { HttpInterceptor } from '#interceptors/tokens-and-types.js';
import type { RawRequest, RawResponse } from '#services/request.js';
import type { PathParam } from '#services/router.js';
import type { HttpServer } from '#types/server-options.js';

export const HTTP_INTERCEPTORS = new InjectionToken<HttpInterceptor[]>('HTTP_INTERCEPTORS');
/**
 * DI token for native webserver request.
 */
export const RAW_REQ = createInjectionSymbol<RawRequest>('RAW_REQ');
/**
 * DI token for native webserver response.
 */
export const RAW_RES = createInjectionSymbol<RawResponse>('RAW_RES');

/**
 * DI token for path params that is returned by `@ditsmod/rest`.
 */
export const RAW_PATH_PARAMS = createInjectionSymbol<PathParam[]>('RAW_PATH_PARAMS');
export const PATH_PARAMS = createInjectionSymbol<AnyObj>('PATH_PARAMS');
export const QUERY_PARAMS = createInjectionSymbol<AnyObj>('QUERY_PARAMS');
/**
 * DI token for querystring that is returned by `RequestDispatcher` after spliting `rawReq.url` by question mark.
 */
export const QUERY_STRING = createInjectionSymbol<string>('QUERY_STRING');

/**
 * A DI token that allows you to obtain the instance of the server that is serving the current application.
 */
export const SERVER = new InjectionToken<HttpServer>('SERVER');
