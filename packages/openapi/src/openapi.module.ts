import { XOasObject } from '@ts-stack/openapi-spec';
import { featureModule, ModuleWithParams, Providers } from '@ditsmod/core';
import { RoutingModule, PreRouterExtension, RoutesExtension } from '@ditsmod/routing';

import { OpenapiCompilerExtension } from './extensions/openapi-compiler.extension.js';
import { OpenapiRoutesExtension } from './extensions/openapi-routes.extension.js';
import { OpenapiController } from './openapi.controller.js';
import { SwaggerOAuthOptions } from './swagger-ui/o-auth-options.js';
import { OasConfigFiles, OasExtensionConfig } from './types/oas-extension-options.js';
import { OpenapiLogMediator } from '#services/openapi-log-mediator.js';
import { OpenapiErrorMediator } from '#services/openapi-error-mediator.js';

@featureModule({
  imports: [RoutingModule],
  controllers: [OpenapiController],
  providersPerApp: [OasConfigFiles],
  providersPerMod: [OpenapiLogMediator, OpenapiErrorMediator],
  extensions: [
    { extension: OpenapiRoutesExtension, export: true },
    {
      extension: OpenapiCompilerExtension,
      afterExtensions: [RoutesExtension],
      beforeExtensions: [PreRouterExtension],
      export: true,
    },
  ],
  exports: [RoutingModule],
})
export class OpenapiModule {
  /**
   * @param oasObject This object used for OpenAPI per application.
   * @param absolutePath This absolute path used for OpenAPI module with params.
   */
  static withParams(oasObject: XOasObject<any>, absolutePath?: string, swaggerOAuthOptions?: SwaggerOAuthOptions) {
    const oasExtensionConfig: OasExtensionConfig = {
      oasObject,
      swaggerOAuthOptions,
    };

    const moduleWithParams: ModuleWithParams<OpenapiModule> = {
      module: this,
      providersPerApp: new Providers().useValue<OasExtensionConfig>(OasExtensionConfig, oasExtensionConfig),
    };

    if (typeof absolutePath == 'string') {
      moduleWithParams.absolutePath = absolutePath;
    }

    return moduleWithParams;
  }
}
