import { Provider } from '@ditsmod/core';

import { RAW_REQ, RAW_RES, A_PATH_PARAMS, PATH_PARAMS, QUERY_PARAMS, QUERY_STRING } from '#types/constants.js';
import { Req } from '../services/request.js';
import { Res } from '../services/response.js';

export const defaultProvidersPerReq: Readonly<Provider[]> = [
  { token: RAW_REQ },
  { token: RAW_RES },
  { token: A_PATH_PARAMS },
  { token: PATH_PARAMS },
  { token: QUERY_PARAMS },
  { token: QUERY_STRING },
  Req,
  Res,
];
