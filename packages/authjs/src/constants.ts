import { AuthConfig } from '@auth/core/types';
import { InjectionToken } from '@ditsmod/core';

export const AUTHJS_CONFIG = new InjectionToken<AuthConfig>('AUTHJS_CONFIG');
export const AUTHJS_SESSION = new InjectionToken('AUTHJS_SESSION');
