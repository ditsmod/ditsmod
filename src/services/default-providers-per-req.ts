import { ControllerErrorHandler } from '../types/controller-error-handler';
import { ServiceProvider } from '../types/service-provider';
import { DefaultControllerErrorHandler } from './default-controller-error-handler';

export const defaultProvidersPerReq: Readonly<ServiceProvider[]> = [
  Request,
  Response,
  { provide: ControllerErrorHandler, useClass: DefaultControllerErrorHandler }
];
