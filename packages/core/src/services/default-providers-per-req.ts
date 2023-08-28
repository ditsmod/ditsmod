import { HttpErrorHandler } from './http-error-handler.js';
import { ServiceProvider } from '#types/mix.js';
import { DefaultHttpErrorHandler } from './default-http-error-handler.js';
import { HttpBackend, HttpFrontend } from '#types/http-interceptor.js';
import { DefaultHttpBackend } from './default-http-backend.js';
import { DefaultHttpFrontend } from './default-http-frontend.js';
import { Req } from './request.js';
import { Res } from './response.js';
import { A_PATH_PARAMS, NODE_REQ, NODE_RES, PATH_PARAMS, QUERY_STRING, QUERY_PARAMS } from '#constans';
import { ChainMaker } from './chain-maker.js';

export const defaultProvidersPerReq: Readonly<ServiceProvider[]> = [
  { token: HttpErrorHandler, useClass: DefaultHttpErrorHandler },
  { token: HttpFrontend, useClass: DefaultHttpFrontend },
  { token: HttpBackend, useClass: DefaultHttpBackend },
  { token: ChainMaker, useFactory: [ChainMaker, ChainMaker.prototype.makeChain] },
  { token: NODE_REQ, useValue: {} },
  { token: NODE_RES, useValue: {} },
  { token: A_PATH_PARAMS, useValue: undefined },
  { token: PATH_PARAMS, useValue: undefined },
  { token: QUERY_PARAMS, useValue: undefined },
  { token: QUERY_STRING, useValue: undefined },
  Req,
  Res,
];
