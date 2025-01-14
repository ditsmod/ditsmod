import { HttpMethod, InjectionToken } from '@ditsmod/core';

export const ALLOW_METHODS = new InjectionToken<HttpMethod[]>('ALLOW_METHODS');
