import { InjectionToken } from '@ts-stack/di';

export interface Extension<T = any> {
  init(): T | Promise<T>;
}

export const DEFAULT_EXTENSIONS = new InjectionToken<Extension[]>('DEFAULT_EXTENSIONS');
export const ROUTES_EXTENSIONS = new InjectionToken<Extension[]>('ROUTES_EXTENSIONS');
