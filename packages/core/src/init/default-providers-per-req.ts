import { A_PATH_PARAMS, REQ, RES, PATH_PARAMS, QUERY_PARAMS, QUERY_STRING } from '#constans';
import { Provider } from '#types/mix.js';
import { Req } from '#services/request.js';
import { Res } from '#services/response.js';

export const defaultProvidersPerReq: Readonly<Provider[]> = [
  { token: REQ, useValue: {} },
  { token: RES, useValue: {} },
  { token: A_PATH_PARAMS, useValue: undefined },
  { token: PATH_PARAMS, useValue: undefined },
  { token: QUERY_PARAMS, useValue: undefined },
  { token: QUERY_STRING, useValue: undefined },
  Req,
  Res,
];
