import type { Provider } from '@ditsmod/core';
import { Req } from '#services/request.js';

export const defaultProvidersPerReq: Readonly<Provider[]> = [
  Req,
];
