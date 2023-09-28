import { Extension, HttpMethod, InjectionToken } from '@ditsmod/core';

export const CORS_EXTENSIONS = new InjectionToken<Extension<void>[]>('CORS_EXTENSIONS');
export const ALLOW_METHODS = new InjectionToken<HttpMethod[]>('ALLOW_METHODS');
