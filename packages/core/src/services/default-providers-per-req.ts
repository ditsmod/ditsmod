import { ControllerErrorHandler } from '../types/controller-error-handler';
import { ServiceProvider } from '../types/service-provider';
import { DefaultControllerErrorHandler } from './default-controller-error-handler';
import { Request } from './request';
import { Response } from './response';
import { HttpBackend, HttpFrontend, HttpHandler, DefaultHttpHandler } from '../types/http-interceptor';
import { DefaultHttpBackend } from './default-http-backend';
import { DefaultHttpFrontend } from './default-http-frontend';

export const defaultProvidersPerReq: Readonly<ServiceProvider[]> = [
  { provide: ControllerErrorHandler, useClass: DefaultControllerErrorHandler },
  { provide: HttpFrontend, useClass: DefaultHttpFrontend },
  { provide: HttpBackend, useClass: DefaultHttpBackend },
  { provide: HttpHandler, useClass: DefaultHttpHandler },
  Request,
  Response,
];
