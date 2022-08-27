import { InjectionToken } from '@ts-stack/di';

import { ModuleExtract } from './models/module-extract';
import { HttpInterceptor } from './types/http-interceptor';
import { MetadataPerMod2 } from './types/metadata-per-mod';
import { Extension, ServiceProvider } from './types/mix';
import { PathParam } from './types/router';
import { NodeRequest, NodeResponse } from './types/server-options';
/**
 * Group extensions that setting routes for router.
 */
export const PRE_ROUTER_EXTENSIONS = new InjectionToken<Extension<void>[]>('PRE_ROUTER_EXTENSIONS');
/**
 * Group extensions that returns `MetadataPerMod2[]` for a router.
 */
export const ROUTES_EXTENSIONS = new InjectionToken<Extension<MetadataPerMod2>[]>('ROUTES_EXTENSIONS');
export const HTTP_INTERCEPTORS = new InjectionToken<HttpInterceptor[]>('HTTP_INTERCEPTORS');
export const PATH_PARAMS = new InjectionToken<PathParam[]>('PATH_PARAMS');
export const QUERY_STRING = new InjectionToken('QUERY_STRING');
export const defaultProvidersPerMod: ServiceProvider[] = [ModuleExtract];
export const NODE_REQ = new InjectionToken<NodeRequest>('NODE_REQ');
export const NODE_RES = new InjectionToken<NodeResponse>('NODE_RES');
export const EXTENSIONS_COUNTERS = new InjectionToken<Map<ServiceProvider, number>>('EXTENSIONS_COUNTERS');
