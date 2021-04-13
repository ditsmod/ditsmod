import { Module, edk, ModuleWithParams, ServiceProvider } from '@ditsmod/core';

import { OpenapiExtension } from './extensions/openapi.extension';
import { OAS_HTTP_METHODS } from './models/oas-http-methods';
import { OasRouteMeta } from './types/oas-route-meta';

@Module({
  providersPerApp: [
    { provide: edk.ROUTES_EXTENSIONS, useClass: OpenapiExtension, multi: true },
    { provide: OAS_HTTP_METHODS, useValue: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH', 'TRACE'] },
  ],
  providersPerReq: [{ provide: OasRouteMeta, useExisting: edk.RouteMeta }],
  exports: [OasRouteMeta],
  extensions: [edk.ROUTES_EXTENSIONS],
})
export class OpenapiModule {
  static withParams(providersPerApp: ServiceProvider[]): ModuleWithParams {
    return { module: OpenapiModule, providersPerApp };
  }
}
