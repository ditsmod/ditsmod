import { XOasObject } from '@ts-stack/openapi-spec';
import {
  Module,
  ModuleWithParams,
  PRE_ROUTER_EXTENSIONS,
  Providers,
  RouteMeta,
  ROUTES_EXTENSIONS,
} from '@ditsmod/core';

import { OpenapiCompilerExtension } from './extensions/openapi-compiler.extension';
import { OpenapiRoutesExtension } from './extensions/openapi-routes.extension';
import { OAS_COMPILER_EXTENSIONS } from './di-tokens';
import { OasRouteMeta } from './types/oas-route-meta';
import { OpenapiController } from './openapi.controller';
import { SwaggerConfigManager } from './services/swagger-config-manager';
import { SwaggerOAuthOptions } from './swagger-ui/swagger-o-auth-options';
import { OasConfigFiles, OasExtensionOptions } from './types/oas-extension-options';
import { OpenapiLogMediator } from './services/openapi-log-mediator';

@Module({
  controllers: [OpenapiController],
  providersPerApp: [OasConfigFiles],
  providersPerMod: [SwaggerConfigManager, ...new Providers().useLogMediator(OpenapiLogMediator)],
  providersPerRou: [{ provide: OasRouteMeta, useExisting: RouteMeta }],
  exports: [OasRouteMeta],
  extensions: [
    [ROUTES_EXTENSIONS, OpenapiRoutesExtension, true],
    [OAS_COMPILER_EXTENSIONS, PRE_ROUTER_EXTENSIONS, OpenapiCompilerExtension, true],
  ],
})
export class OpenapiModule {
  static withParams(
    oasObject: XOasObject<any>,
    swaggerOAuthOptions?: SwaggerOAuthOptions,
  ): ModuleWithParams<OpenapiModule> {
    const oasExtensionOptions: OasExtensionOptions = {
      oasObject,
      swaggerOAuthOptions,
    };

    return {
      module: OpenapiModule,
      path: '',
      providersPerMod: [{ provide: OasExtensionOptions, useValue: oasExtensionOptions }],
    };
  }
}
