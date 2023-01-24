import { InjectionToken } from '@ditsmod/core';

/**
 * This class is used ad DI token to get jwt payload.
 */
export const JWT_PAYLOAD = new InjectionToken<any>('JWT_PAYLOAD');