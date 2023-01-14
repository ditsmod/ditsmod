import { ControllerErrorHandler } from './controller-error-handler';
import { ServiceProvider } from '../types/mix';
import { DefaultControllerErrorHandler } from './default-controller-error-handler';
import { HttpBackend, HttpFrontend } from '../types/http-interceptor';
import { DefaultHttpBackend } from './default-http-backend';
import { DefaultHttpFrontend } from './default-http-frontend';
import { Req } from './request';
import { Res } from './response';
import { A_PATH_PARAMS, NODE_REQ, NODE_RES, QUERY_STRING } from '../constans';
import { ChainMaker } from './chain-maker';

export const defaultProvidersPerReq: Readonly<ServiceProvider[]> = [
  { token: ControllerErrorHandler, useClass: DefaultControllerErrorHandler },
  { token: HttpFrontend, useClass: DefaultHttpFrontend },
  { token: HttpBackend, useClass: DefaultHttpBackend },
  { token: ChainMaker, useFactory: [ChainMaker, ChainMaker.prototype.makeChain] },
  { token: NODE_REQ, useValue: {} },
  { token: NODE_RES, useValue: {} },
  { token: A_PATH_PARAMS, useValue: {} },
  { token: QUERY_STRING, useValue: {} },
  Req,
  Res,
];
