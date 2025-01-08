import { featureModule, ModuleWithParams } from '@ditsmod/core';
import { PRE_ROUTER_EXTENSIONS, ROUTES_EXTENSIONS } from '@ditsmod/routing';
import { BodyParserGroup } from '@ts-stack/body-parser';
import { Multer } from '@ts-stack/multer';

import { HTTP_BODY, BodyParserConfig } from './body-parser-config.js';
import { BodyParserExtension, BODY_PARSER_EXTENSIONS } from './body-parser.extension.js';
import { BodyParserGroupFactory } from './body-parser-group.factory.js';
import { MulterFactory } from './multer.factory.js';
import { MulterParser } from './multer.parser.js';
import { MulterCtxParser } from './multer-ctx.parser.js';

/**
 * Adds `BodyParserInterceptor` to all requests with HTTP methods specified in `bodyParserConfig.acceptMethods`.
 * This is done using `BodyParserExtension` in `BODY_PARSER_EXTENSIONS` group.
 */
@featureModule({
  providersPerMod: [
    MulterCtxParser,
    {
      token: Multer,
      useFactory: [MulterFactory, MulterFactory.prototype.getMulter],
    },
  ],
  providersPerRou: [
    {
      token: BodyParserGroup,
      useFactory: [BodyParserGroupFactory, BodyParserGroupFactory.prototype.getBodyParserGroup],
    },
  ],
  providersPerReq: [{ token: HTTP_BODY }, MulterParser],
  exports: [HTTP_BODY, BodyParserGroup, MulterParser, MulterCtxParser],
  extensions: [
    {
      extension: BodyParserExtension,
      group: BODY_PARSER_EXTENSIONS,
      afterGroups: [ROUTES_EXTENSIONS],
      beforeGroups: [PRE_ROUTER_EXTENSIONS],
      exportOnly: true,
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
