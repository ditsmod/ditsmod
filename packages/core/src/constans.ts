import { InjectionToken } from './di';

import { ModuleExtract } from './models/module-extract';
import { HttpInterceptor } from './types/http-interceptor';
import { MetadataPerMod2 } from './types/metadata-per-mod';
import { Extension, ServiceProvider } from './types/mix';
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
