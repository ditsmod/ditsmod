import { ModuleWithParams } from '@ditsmod/core';
import { PreRouterExtension, RestRouteExtension, restModule } from '@ditsmod/rest';
import { BodyParserGroup } from '@ts-stack/body-parser';
import { Multer } from '@ts-stack/multer';

import { HTTP_BODY, BodyParserConfig } from './body-parser-config.js';
import { BodyParserExtension } from './body-parser.extension.js';
import { BodyParserGroupFactory } from './body-parser-group.factory.js';
import { MulterFactory } from './multer.factory.js';
import { MulterParser } from './multer.parser.js';
import { RouteScopedMulterParser } from './multer-ctx.parser.js';

/**
 * Adds `BodyParserInterceptor` to all requests with HTTP methods specified in `bodyParserConfig.acceptMethods`.
 * This is done using `BodyParserExtension`.
 */
@restModule({
  providersPerMod: [
    RouteScopedMulterParser,
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
  providersPerReq: [MulterParser],
  extensions: [
    {
      extension: BodyParserExtension,
      afterExtensions: [RestRouteExtension],
      beforeExtensions: [PreRouterExtension],
      exportOnly: true,
    },
  ],
  exports: [RouteScopedMulterParser, BodyParserGroup, MulterParser],
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
