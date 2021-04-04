import { InjectionToken } from '@ts-stack/di';

export interface Extension<T = any> {
  init(...args: any): T | Promise<T>;
}

export const ROUTES_EXTENSIONS = new InjectionToken<Extension[]>('ROUTES_EXTENSIONS');
