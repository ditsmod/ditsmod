import type { HttpMethod } from '@holu/core';
import { InjectionToken } from '@holu/core';

export const ALLOW_METHODS = new InjectionToken<HttpMethod[]>('ALLOW_METHODS');
