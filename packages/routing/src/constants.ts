import { InjectionToken, Extension } from '@ditsmod/core';
import { HttpInterceptor } from './interceptors/tokens-and-types.js';
import { MetadataPerMod3 } from './types.js';

/**
 * A marker used in HTTP interceptors for a silent response (no response). If `DefaultHttpFrontend`
 * receives any response from HTTP request handlers other than one containing `SILENT_RES`,
 * it automatically sends the response.
 * 
 * In other words, if `DefaultHttpFrontend` receives a response from interceptors with the value
 * `SILENT_RES`, it disables the response for the current request.
 */
export const SILENT_RES = Symbol();
export const HTTP_INTERCEPTORS = new InjectionToken<HttpInterceptor[]>('HTTP_INTERCEPTORS');
/**
 * A group of extensions that setting routes for router.
 */

export const PRE_ROUTER_EXTENSIONS = new InjectionToken<Extension<void>[]>('PRE_ROUTER_EXTENSIONS');
/**
 * A group of extensions that returns `MetadataPerMod3[]` for a router.
 */
export const ROUTES_EXTENSIONS = new InjectionToken<Extension<MetadataPerMod3>[]>('ROUTES_EXTENSIONS');
