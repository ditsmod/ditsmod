import { createInjectionSymbol } from '@ditsmod/core';

/**
 * This class is used ad DI token to get jwt payload.
 */
export const JWT_PAYLOAD = createInjectionSymbol('JWT_PAYLOAD');