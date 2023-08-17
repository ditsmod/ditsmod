import { HttpErrorHandler } from './http-error-handler';
import { ServiceProvider } from '../types/mix';
import { DefaultControllerErrorHandler } from './default-controller-error-handler';
import { HttpBackend, HttpFrontend } from '../types/http-interceptor';
import { DefaultHttpBackend } from './default-http-backend';
import { DefaultHttpFrontend } from './default-http-frontend';
import { Req } from './request';
import { Res } from './response';
import { A_PATH_PARAMS, NODE_REQ, NODE_RES, PATH_PARAMS, QUERY_STRING, QUERY_PARAMS } from '../constans';
import { ChainMaker } from './chain-maker';

export const defaultProvidersPerReq: Readonly<ServiceProvider[]> = [
  { token: HttpErrorHandler, useClass: DefaultControllerErrorHandler },
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
