import { InjectionToken } from './di/index.js';

import { ModuleExtract } from './models/module-extract.js';
import { HttpInterceptor } from './types/http-interceptor.js';
import { MetadataPerMod2 } from './types/metadata-per-mod.js';
import { AnyObj, Extension, ServiceProvider } from './types/mix.js';
import { NodeRequest, NodeResponse } from './types/server-options.js';
/**
 * A group of extensions that setting routes for router.
 */
export const PRE_ROUTER_EXTENSIONS = new InjectionToken<Extension<void>[]>('PRE_ROUTER_EXTENSIONS');
/**
 * A group of extensions that returns `MetadataPerMod2[]` for a router.
 */
export const ROUTES_EXTENSIONS = new InjectionToken<Extension<MetadataPerMod2>[]>('ROUTES_EXTENSIONS');
export const HTTP_INTERCEPTORS = new InjectionToken<HttpInterceptor[]>('HTTP_INTERCEPTORS');
export const defaultProvidersPerMod: ServiceProvider[] = [ModuleExtract];
export const EXTENSIONS_COUNTERS = new InjectionToken<Map<ServiceProvider, number>>('EXTENSIONS_COUNTERS');
/**
 * DI token for native Node.js request.
 */
export const NODE_REQ = new InjectionToken<NodeRequest>('NODE_REQ');
/**
 * DI token for native Node.js response.
 */
export const NODE_RES = new InjectionToken<NodeResponse>('NODE_RES');
/**
 * DI token for path params that is returned by `@ditsmod/router`.
 */
export const A_PATH_PARAMS = new InjectionToken<NodeResponse>('A_PATH_PARAMS');
export const PATH_PARAMS = new InjectionToken<AnyObj>('PATH_PARAMS');
export const QUERY_PARAMS = new InjectionToken<AnyObj>('QUERY_PARAMS');
/**
 * DI token for querystring that is returned by `PreRouter` after spliting `nodeReq.url` by question mark.
 */
export const QUERY_STRING = new InjectionToken<NodeRequest>('QUERY_STRING');
