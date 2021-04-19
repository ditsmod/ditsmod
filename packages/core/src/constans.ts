import { InjectionToken } from '@ts-stack/di';

import { ModConfig } from './models/mod-config';
import { HttpInterceptor } from './types/http-interceptor';
import { AppMetadataMap, Extension, ServiceProvider } from './types/mix';
import { RawRouteMeta } from './types/route-data';

export const APP_METADATA_MAP = new InjectionToken<AppMetadataMap>('APP_METADATA_MAP');
/**
 * Group extensions that returns void.
 */
export const VOID_EXTENSIONS = new InjectionToken<Extension<void>[]>('VOID_EXTENSIONS');
/**
 * Group extensions that returns `RawRouteMeta[]` for a router.
 */
export const ROUTES_EXTENSIONS = new InjectionToken<Extension<RawRouteMeta>[]>('ROUTES_EXTENSIONS');
export const defaultExtensions: InjectionToken<any>[] = [ROUTES_EXTENSIONS, VOID_EXTENSIONS];
export const defaultProvidersPerMod: ServiceProvider[] = [ModConfig];
export const HTTP_INTERCEPTORS = new InjectionToken<HttpInterceptor[]>('HTTP_INTERCEPTORS');
