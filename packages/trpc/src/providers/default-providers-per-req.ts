import { awaitTokens, Provider } from '@ditsmod/core';

import { RAW_REQ, RAW_RES } from '#types/types.js';
import { Req } from '#services/request.js';
import { Res } from '#services/response.js';
import { TRPC_OPTS } from '#types/constants.js';

export const defaultProvidersPerReq: Readonly<Provider[]> = [
  ...awaitTokens([RAW_REQ, RAW_RES, TRPC_OPTS]),
  Req,
  Res,
];
