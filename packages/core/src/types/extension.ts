import { InjectionToken } from '@ts-stack/di';
import { RawRouteMeta } from './route-data';

export interface Extension<T> {
  init(): Promise<T>;
}

/**
 * Group extensions that returns void.
 */
export const VOID_EXTENSIONS = new InjectionToken<Extension<void>[]>('VOID_EXTENSIONS');
/**
 * Group extensions that returns `RawRouteMeta[]` for a router.
 */
export const ROUTES_EXTENSIONS = new InjectionToken<Extension<RawRouteMeta>[]>('ROUTES_EXTENSIONS');
