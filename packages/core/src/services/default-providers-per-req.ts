import { ControllerErrorHandler } from '../services/controller-error-handler';
import { ServiceProvider } from '../types/mix';
import { DefaultControllerErrorHandler } from './default-controller-error-handler';
import { Req } from './request';
import { Res } from './response';
import { HttpBackend, HttpFrontend, HttpHandler } from '../types/http-interceptor';
import { DefaultHttpBackend } from './default-http-backend';
import { DefaultHttpFrontend } from './default-http-frontend';
import { DefaultHttpHandler } from './default-http-handler';

export const defaultProvidersPerReq: Readonly<ServiceProvider[]> = [
  { token: ControllerErrorHandler, useClass: DefaultControllerErrorHandler },
  { token: HttpFrontend, useClass: DefaultHttpFrontend },
  { token: HttpBackend, useClass: DefaultHttpBackend },
  { token: HttpHandler, useClass: DefaultHttpHandler },
  Req,
  Res,
];
