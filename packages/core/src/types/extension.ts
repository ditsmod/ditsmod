import { InjectionToken } from '@ts-stack/di';
import { PreRouteMeta } from './route-data';

export interface Extension<T = any> {
  init(): T | Promise<T>;
}

export const DEFAULT_EXTENSIONS = new InjectionToken<Extension<void>[]>('DEFAULT_EXTENSIONS');
export const ROUTES_EXTENSIONS = new InjectionToken<Extension<PreRouteMeta[]>[]>('ROUTES_EXTENSIONS');
