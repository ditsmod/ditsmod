import { InjectionToken } from '#di/top/injection-token.js';
import type { Provider } from '#di/top/types-and-models.js';

export const PROVIDERS_PER_APP = new InjectionToken<Provider[]>('PROVIDERS_PER_APP');
