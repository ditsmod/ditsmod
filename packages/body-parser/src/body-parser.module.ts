import { featureModule, ModuleWithParams, PRE_ROUTER_EXTENSIONS } from '@ditsmod/core';

import { HTTP_BODY, BodyParserConfig } from './body-parser-config';
import { BodyParserExtension, BODY_PARSER_EXTENSIONS } from './body-parser.extension';

/**
 * Adds `BodyParserInterceptor` to all requests with HTTP methods specified in `bodyParserConfig.acceptMethods`.
 * This is done using `BodyParserExtension` in `BODY_PARSER_EXTENSIONS` group.
 */
@featureModule({
  providersPerReq: [{ token: HTTP_BODY, useValue: {} }],
  exports: [HTTP_BODY],
  extensions: [
    {
      extension: BodyParserExtension,
      groupToken: BODY_PARSER_EXTENSIONS,
      nextToken: PRE_ROUTER_EXTENSIONS,
      exported: true,
    },
  ],
})
export class BodyParserModule {
  static withParams(config: BodyParserConfig): ModuleWithParams<BodyParserModule> {
    return {
      module: this,
      providersPerMod: [{ token: BodyParserConfig, useValue: config }],
      exports: [BodyParserConfig],
    };
  }
}
