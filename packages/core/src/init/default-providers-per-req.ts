import { A_PATH_PARAMS, HTTP_REQ, HTTP_RES, PATH_PARAMS, QUERY_PARAMS, QUERY_STRING } from '#public-api/constans.js';
import { Provider } from '#types/mix.js';
import { Req } from '#services/request.js';
import { Res } from '#services/response.js';

export const defaultProvidersPerReq: Readonly<Provider[]> = [
  { token: HTTP_REQ, useValue: {} },
  { token: HTTP_RES, useValue: {} },
  { token: A_PATH_PARAMS, useValue: undefined },
  { token: PATH_PARAMS, useValue: undefined },
  { token: QUERY_PARAMS, useValue: undefined },
  { token: QUERY_STRING, useValue: undefined },
  Req,
  Res,
];
