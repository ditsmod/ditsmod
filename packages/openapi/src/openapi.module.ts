import { Module, edk, ModuleWithParams, ServiceProvider } from '@ditsmod/core';

import { OpenapiCompilerExtension } from './extensions/openapi-compiler.extension';
import { OpenapiRoutesExtension } from './extensions/openapi-routes.extension';
import { OAS_COMPILER_EXTENSIONS, OAS_OBJECT } from './di-tokens';
import { DEFAULT_OAS_OBJECT } from './constants';
import { OasRouteMeta } from './types/oas-route-meta';
import { OpenapiController } from './openapi.controller';
import { SwaggerConfigManager } from './services/swagger-config-manager';

@Module({
  controllers: [OpenapiController],
  providersPerApp: [
    { provide: edk.ROUTES_EXTENSIONS, useClass: OpenapiRoutesExtension, multi: true },
    { provide: OAS_COMPILER_EXTENSIONS, useClass: OpenapiCompilerExtension, multi: true },
    { provide: `BEFORE ${edk.PRE_ROUTER_EXTENSIONS}`, useClass: OpenapiCompilerExtension, multi: true },
    { provide: OAS_OBJECT, useValue: DEFAULT_OAS_OBJECT },
  ],
  providersPerMod: [SwaggerConfigManager],
  providersPerRou: [{ provide: OasRouteMeta, useExisting: edk.RouteMeta }],
  exports: [{ provide: OasRouteMeta, useExisting: edk.RouteMeta }],
  extensions: [edk.ROUTES_EXTENSIONS, OAS_COMPILER_EXTENSIONS],
})
export class OpenapiModule {
  static withParams(providersPerApp: ServiceProvider[]): ModuleWithParams {
    return { module: OpenapiModule, providersPerApp };
  }
}
