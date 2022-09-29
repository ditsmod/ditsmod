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
    { extension: OpenapiRoutesExtension, groupToken: ROUTES_EXTENSIONS, exported: true },
    {
      extension: OpenapiCompilerExtension,
      groupToken: OAS_COMPILER_EXTENSIONS,
      nextToken: PRE_ROUTER_EXTENSIONS,
      exported: true,
    },
  ],
})
export class OpenapiModule {
  /**
   * @param oasObject This object used for OpenAPI per application.
   * @param path This path used for OpenAPI module with params.
   * @param swaggerOAuthOptions This options used for OpenAPI per application.
   */
  static withParams(oasObject: XOasObject<any>, path?: string, swaggerOAuthOptions?: SwaggerOAuthOptions) {
    const oasExtensionOptions: OasExtensionOptions = {
      oasObject,
      swaggerOAuthOptions,
    };

    const moduleWithParams: ModuleWithParams<OpenapiModule> = {
      module: OpenapiModule,
      providersPerApp: [...new Providers().useValue<OasExtensionOptions>(OasExtensionOptions, oasExtensionOptions)],
    };

    if (typeof path == 'string') {
      moduleWithParams.path = path;
    }

    return moduleWithParams;
  }
}
