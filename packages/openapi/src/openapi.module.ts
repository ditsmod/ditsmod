import { Module, edk, ModuleWithParams, ServiceProvider } from '@ditsmod/core';

import { OpenapiCompilerExtension } from './extensions/openapi-compiler.extension';
import { OpenapiRoutesExtension } from './extensions/openapi-routes.extension';
import { OAS_COMPILER_EXTENSIONS, OAS_HTTP_METHODS, OAS_OBJECT } from './di-tokens';
import { DEFAULT_OAS_HTTP_METHODS, DEFAULT_OAS_OBJECT } from './constants';
import { OasRouteMeta } from './types/oas-route-meta';

@Module({
  providersPerApp: [
    { provide: edk.ROUTES_EXTENSIONS, useClass: OpenapiRoutesExtension, multi: true },
    { provide: OAS_COMPILER_EXTENSIONS, useClass: OpenapiCompilerExtension, multi: true },
    { provide: OAS_OBJECT, useValue: DEFAULT_OAS_OBJECT },
    { provide: OAS_HTTP_METHODS, useValue: DEFAULT_OAS_HTTP_METHODS },
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
