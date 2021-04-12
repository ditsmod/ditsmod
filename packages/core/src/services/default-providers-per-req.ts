import { ControllerErrorHandler } from '../services/controller-error-handler';
import { ServiceProvider } from '../types/mix';
import { DefaultControllerErrorHandler } from './default-controller-error-handler';
import { Request } from './request';
import { Response } from './response';
import { HttpBackend, HttpFrontend, HttpHandler } from '../types/http-interceptor';
import { DefaultHttpBackend } from './default-http-backend';
import { DefaultHttpFrontend } from './default-http-frontend';
import { DefaultHttpHandler } from './default-http-handler';

export const defaultProvidersPerReq: Readonly<ServiceProvider[]> = [
  { provide: ControllerErrorHandler, useClass: DefaultControllerErrorHandler },
  { provide: HttpFrontend, useClass: DefaultHttpFrontend },
  { provide: HttpBackend, useClass: DefaultHttpBackend },
  { provide: HttpHandler, useClass: DefaultHttpHandler },
  Request,
  Response,
];
