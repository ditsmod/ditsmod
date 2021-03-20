import { ControllerErrorHandler } from '../types/controller-error-handler';
import { ServiceProvider } from '../types/service-provider';
import { DefaultControllerErrorHandler } from './default-controller-error-handler';
import { Request } from './request';
import { Response } from './response';
import { HttpBackend, HttpInterceptorsChain } from '../types/http-interceptor';
import { DefaultHttpBackend } from './default-http-backend';

export const defaultProvidersPerReq: Readonly<ServiceProvider[]> = [
  { provide: ControllerErrorHandler, useClass: DefaultControllerErrorHandler },
  { provide: HttpBackend, useClass: DefaultHttpBackend },
  HttpInterceptorsChain,
  Request,
  Response,
];
