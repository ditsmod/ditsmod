import type { Provider } from '@ditsmod/core';
import { DefaultHeadStrategy } from '#services/default-head-strategy.js';
import { HeadStrategy } from '#services/head-strategy.js';

export const defaultProvidersPerApp: Readonly<Provider[]> = [
  { token: HeadStrategy, useClass: DefaultHeadStrategy },
];
