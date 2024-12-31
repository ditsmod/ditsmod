import { AuthConfig } from '@auth/core/types';
import { Extension, InjectionToken } from '@ditsmod/core';

export const AUTHJS_CONFIG = new InjectionToken<AuthConfig>('AUTHJS_CONFIG');
export const AUTHJS_SESSION = new InjectionToken('AUTHJS_SESSION');
export const AUTHJS_EXTENSIONS = new InjectionToken<Extension<void>[]>('AUTHJS_EXTENSIONS');
