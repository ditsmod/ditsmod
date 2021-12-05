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
  providersPerApp: [{ provide: OAS_OBJECT, useValue: DEFAULT_OAS_OBJECT }],
  providersPerMod: [SwaggerConfigManager],
  providersPerRou: [{ provide: OasRouteMeta, useExisting: edk.RouteMeta }],
  exports: [OasRouteMeta],
  extensions: [
    [edk.ROUTES_EXTENSIONS, OpenapiRoutesExtension, true],
    [edk.PRE_ROUTER_EXTENSIONS, OAS_COMPILER_EXTENSIONS, OpenapiCompilerExtension, true],
  ],
})
export class OpenapiModule {
  static withParams(providersPerApp: ServiceProvider[]): ModuleWithParams {
    return { module: OpenapiModule, providersPerApp };
  }
}
