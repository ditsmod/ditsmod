import { InjectionToken } from '#di';

import { PathParam } from '#types/router.js';
import { HttpServer } from '#types/server-options.js';
import { ModuleExtract } from './types/module-extract.js';
import { AnyObj, Provider } from './types/mix.js';
import { HttpRequest, HttpResponse } from './types/server-options.js';

/**
 * A DI token that allows you to obtain the instance of the server that is serving the current application.
 */
export const SERVER = new InjectionToken<HttpServer>('SERVER');
export const defaultProvidersPerMod: Provider[] = [ModuleExtract];
/**
 * DI token for native Node.js request.
 */
export const REQ = new InjectionToken<HttpRequest>('REQ');
/**
 * DI token for native Node.js response.
 */
export const RES = new InjectionToken<HttpResponse>('RES');
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
