import { A_PATH_PARAMS, NODE_REQ, NODE_RES, PATH_PARAMS, QUERY_PARAMS, QUERY_STRING } from '#constans';
import { Provider } from '#types/mix.js';
import { Req } from '#services/request.js';
import { Res } from '#services/response.js';

export const defaultProvidersPerReq: Readonly<Provider[]> = [
  { token: NODE_REQ, useValue: {} },
  { token: NODE_RES, useValue: {} },
  { token: A_PATH_PARAMS, useValue: undefined },
  { token: PATH_PARAMS, useValue: undefined },
  { token: QUERY_PARAMS, useValue: undefined },
  { token: QUERY_STRING, useValue: undefined },
  Req,
  Res,
];
