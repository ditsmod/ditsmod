import type { Provider } from '@ditsmod/core';

import { Req } from '../services/request.js';
import { Res } from '../services/response.js';

export const defaultProvidersPerReq: Readonly<Provider[]> = [
  Req,
  Res,
];
