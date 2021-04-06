import { InjectionToken } from '@ts-stack/di';
import { PreRouteMeta } from './route-data';

export interface Extension<T> {
  init(): Promise<T>;
}

/**
 * Group extensions that returns void.
 */
export const DEFAULT_EXTENSIONS = new InjectionToken<Extension<void>[]>('DEFAULT_EXTENSIONS');
/**
 * Group extensions that returns `PreRouteMeta[]` for a router.
 */
export const ROUTES_EXTENSIONS = new InjectionToken<Extension<PreRouteMeta>[]>('ROUTES_EXTENSIONS');
