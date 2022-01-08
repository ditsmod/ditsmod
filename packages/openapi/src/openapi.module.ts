import { XOasObject } from '@ts-stack/openapi-spec';
import {
  Module,
  ModuleWithParams,
  PRE_ROUTER_EXTENSIONS,
  RouteMeta,
  ROUTES_EXTENSIONS,
  ServiceProvider,
} from '@ditsmod/core';

import { OpenapiCompilerExtension } from './extensions/openapi-compiler.extension';
import { OpenapiRoutesExtension } from './extensions/openapi-routes.extension';
import { OAS_COMPILER_EXTENSIONS, OAS_OBJECT } from './di-tokens';
import { DEFAULT_OAS_OBJECT } from './constants';
import { OasRouteMeta } from './types/oas-route-meta';
import { OpenapiController } from './openapi.controller';
import { SwaggerConfigManager } from './services/swagger-config-manager';
import { SwaggerOAuthOptions } from './swagger-ui/swagger-o-auth-options';

@Module({
  controllers: [OpenapiController],
  providersPerApp: [{ provide: OAS_OBJECT, useValue: DEFAULT_OAS_OBJECT }],
  providersPerMod: [SwaggerConfigManager],
  providersPerRou: [{ provide: OasRouteMeta, useExisting: RouteMeta }],
  exports: [OasRouteMeta],
  extensions: [
    [ROUTES_EXTENSIONS, OpenapiRoutesExtension, true],
    [PRE_ROUTER_EXTENSIONS, OAS_COMPILER_EXTENSIONS, OpenapiCompilerExtension, true],
  ],
})
export class OpenapiModule {
  static withParams(oasObject: XOasObject<any>, swaggerOAuthOptions?: SwaggerOAuthOptions): ModuleWithParams {
    const providersPerApp: ServiceProvider[] = [{ provide: OAS_OBJECT, useValue: oasObject }];
    if (swaggerOAuthOptions) {
      providersPerApp.push({ provide: SwaggerOAuthOptions, useValue: swaggerOAuthOptions });
    }

    return {
      module: OpenapiModule,
      providersPerApp,
    };
  }
}
