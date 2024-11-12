import { A_PATH_PARAMS, NODE_REQ, NODE_RES, PATH_PARAMS, QUERY_PARAMS, QUERY_STRING } from '#constans';
import { HttpFrontend } from '#interceptors/tokens-and-types.js';
import { Provider } from '#types/mix.js';
import { ChainMaker } from './interceptors/chain-maker.js';
import { DefaultHttpFrontend } from './interceptors/default-http-frontend.js';
import { Req } from './services/request.js';
import { Res } from './services/response.js';

export const defaultProvidersPerReq: Readonly<Provider[]> = [
  { token: HttpFrontend, useClass: DefaultHttpFrontend },
  ChainMaker,
  { token: NODE_REQ, useValue: {} },
  { token: NODE_RES, useValue: {} },
  { token: A_PATH_PARAMS, useValue: undefined },
  { token: PATH_PARAMS, useValue: undefined },
  { token: QUERY_PARAMS, useValue: undefined },
  { token: QUERY_STRING, useValue: undefined },
  Req,
  Res,
];
