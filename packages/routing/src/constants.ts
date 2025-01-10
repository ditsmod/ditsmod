import { InjectionToken, Extension } from '@ditsmod/core';
import { HttpInterceptor } from './interceptors/tokens-and-types.js';
import { MetadataPerMod3 } from './types.js';

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
