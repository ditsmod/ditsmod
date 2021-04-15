import { Module, edk, ModuleWithParams, ServiceProvider } from '@ditsmod/core';

import { OpenapiCompilerExtension } from './extensions/openapi-compiler.extension';
import { OpenapiExtension } from './extensions/openapi.extension';
import { OAS_COMPILER_EXTENSIONS, OAS_HTTP_METHODS } from './di-tokens';
import { OasRouteMeta } from './types/oas-route-meta';

@Module({
  providersPerApp: [
    { provide: edk.ROUTES_EXTENSIONS, useClass: OpenapiExtension, multi: true },
    { provide: OAS_COMPILER_EXTENSIONS, useClass: OpenapiCompilerExtension, multi: true },
    { provide: OAS_HTTP_METHODS, useValue: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH', 'TRACE'] },
  ],
  providersPerRou: [OasRouteMeta],
  exports: [{ provide: OasRouteMeta, useExisting: edk.RouteMeta }],
  extensions: [edk.ROUTES_EXTENSIONS, OAS_COMPILER_EXTENSIONS],
})
export class OpenapiModule {
  static withParams(providersPerApp: ServiceProvider[]): ModuleWithParams {
    return { module: OpenapiModule, providersPerApp };
  }
}
