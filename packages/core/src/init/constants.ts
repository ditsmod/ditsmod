import { InjectionToken, type Provider } from '@ditsmod/core';

export const PROVIDERS_PER_APP = new InjectionToken<Provider[]>('PROVIDERS_PER_APP');
