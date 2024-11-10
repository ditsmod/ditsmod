import { InjectionToken } from '#di';

import { PathParam } from '#types/router.js';
import { NodeServer } from '#types/server-options.js';
import { ModuleExtract } from './types/module-extract.js';
import { HttpInterceptor } from './interceptors/tokens-and-types.js';
import { AnyObj, Provider } from './types/mix.js';
import { NodeRequest, NodeResponse } from './types/server-options.js';

/**
 * A DI token that allows you to obtain the instance of the server that is serving the current application.
 */
export const SERVER = new InjectionToken<NodeServer>('SERVER');
export const HTTP_INTERCEPTORS = new InjectionToken<HttpInterceptor[]>('HTTP_INTERCEPTORS');
export const defaultProvidersPerMod: Provider[] = [ModuleExtract];
/**
 * DI token for native Node.js request.
 */
export const NODE_REQ = new InjectionToken<NodeRequest>('NODE_REQ');
/**
 * DI token for native Node.js response.
 */
export const NODE_RES = new InjectionToken<NodeResponse>('NODE_RES');
/**
 * DI token for path params that is returned by `@ditsmod/routing`.
 */
export const A_PATH_PARAMS = new InjectionToken<PathParam[]>('A_PATH_PARAMS');
export const PATH_PARAMS = new InjectionToken<AnyObj>('PATH_PARAMS');
export const QUERY_PARAMS = new InjectionToken<AnyObj>('QUERY_PARAMS');
/**
 * DI token for querystring that is returned by `PreRouter` after spliting `nodeReq.url` by question mark.
 */
export const QUERY_STRING = new InjectionToken<NodeRequest>('QUERY_STRING');
