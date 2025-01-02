import { Extension, InjectionToken } from '@ditsmod/core';

export const AUTHJS_SESSION = new InjectionToken('AUTHJS_SESSION');
export const AUTHJS_EXTENSIONS = new InjectionToken<Extension<void>[]>('AUTHJS_EXTENSIONS');
