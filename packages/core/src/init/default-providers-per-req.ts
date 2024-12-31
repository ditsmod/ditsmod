import { A_PATH_PARAMS, RAW_REQ, RAW_RES, PATH_PARAMS, QUERY_PARAMS, QUERY_STRING } from '#public-api/constans.js';
import { Provider } from '#types/mix.js';
import { Req } from '#services/request.js';
import { Res } from '#services/response.js';

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
