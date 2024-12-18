import { AuthConfig } from '@auth/core/types';
import { InjectionToken } from '@ditsmod/core';

export const AUTHJS_CONFIG = new InjectionToken<AuthConfig>('AUTHJS_CONFIG');
