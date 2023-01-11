import { ControllerErrorHandler } from './controller-error-handler';
import { ServiceProvider } from '../types/mix';
import { DefaultControllerErrorHandler } from './default-controller-error-handler';
import { HttpBackend, HttpFrontend, HttpHandler } from '../types/http-interceptor';
import { DefaultHttpBackend } from './default-http-backend';
import { DefaultHttpFrontend } from './default-http-frontend';
import { DefaultHttpHandler } from './default-http-handler';
import { Req } from './request';
import { Res } from './response';
import { RequestContext } from '../types/route-data';

export const defaultProvidersPerReq: Readonly<ServiceProvider[]> = [
  { token: ControllerErrorHandler, useClass: DefaultControllerErrorHandler },
  { token: HttpFrontend, useClass: DefaultHttpFrontend },
  { token: HttpBackend, useClass: DefaultHttpBackend },
  { token: HttpHandler, useClass: DefaultHttpHandler },
  RequestContext,
  Req,
  Res
];
