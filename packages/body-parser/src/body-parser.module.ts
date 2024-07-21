import { featureModule, ModuleWithParams } from '@ditsmod/core';
import { PRE_ROUTER_EXTENSIONS } from '@ditsmod/routing';
import { BodyParserGroup } from '@ts-stack/body-parser';

import { HTTP_BODY, BodyParserConfig } from './body-parser-config.js';
import { BodyParserExtension, BODY_PARSER_EXTENSIONS } from './body-parser.extension.js';
import { BodyParsersFactory } from './body-parsers.factory.js';

/**
 * Adds `BodyParserInterceptor` to all requests with HTTP methods specified in `bodyParserConfig.acceptMethods`.
 * This is done using `BodyParserExtension` in `BODY_PARSER_EXTENSIONS` group.
 */
@featureModule({
  providersPerRou: [
    {
      token: BodyParserGroup,
      useFactory: [BodyParsersFactory, BodyParsersFactory.prototype.getBodyParser],
    },
  ],
  providersPerReq: [{ token: HTTP_BODY, useValue: {} }],
  exports: [HTTP_BODY, BodyParserGroup],
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
