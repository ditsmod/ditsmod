import { Provider } from '@ditsmod/core';

import { RAW_REQ, RAW_RES, A_PATH_PARAMS, PATH_PARAMS, QUERY_PARAMS, QUERY_STRING } from './constants.js';
import { Req } from './request.js';
import { Res } from './response.js';


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
