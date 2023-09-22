import { XOasObject } from '@ts-stack/openapi-spec';
import { featureModule, ModuleWithParams, Providers } from '@ditsmod/core';
import { RouterModule, PRE_ROUTER_EXTENSIONS, ROUTES_EXTENSIONS } from '@ditsmod/router';

import { OpenapiCompilerExtension } from './extensions/openapi-compiler.extension.js';
import { OpenapiRoutesExtension } from './extensions/openapi-routes.extension.js';
import { OAS_COMPILER_EXTENSIONS } from './di-tokens.js';
import { OpenapiController } from './openapi.controller.js';
import { OasConfigFiles, OasExtensionOptions } from './types/oas-extension-options.js';
import { OpenapiLogMediator } from './services/openapi-log-mediator.js';

@featureModule({
  imports: [RouterModule],
  controllers: [OpenapiController],
  providersPerApp: [OasConfigFiles],
  providersPerMod: [OpenapiLogMediator],
  extensions: [
    { extension: OpenapiRoutesExtension, groupToken: ROUTES_EXTENSIONS, exported: true },
    {
      extension: OpenapiCompilerExtension,
      groupToken: OAS_COMPILER_EXTENSIONS,
      nextToken: PRE_ROUTER_EXTENSIONS,
      exported: true,
    },
  ],
  exports: [RouterModule]
})
export class OpenapiModule {
  /**
   * @param oasObject This object used for OpenAPI per application.
   * @param path This path used for OpenAPI module with params.
   * @param swaggerOAuthOptions This options used for OpenAPI per application.
   */
  static withParams(oasObject: XOasObject<any>, path?: string) {
    const oasExtensionOptions: OasExtensionOptions = {
      oasObject,
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
