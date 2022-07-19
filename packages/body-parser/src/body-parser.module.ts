import { Module, PRE_ROUTER_EXTENSIONS } from '@ditsmod/core';

import { BodyParserExtension, BODY_PARSER_EXTENSIONS } from './body-parser.extension';

/**
 * Adds `BodyParserInterceptor` to all requests with HTTP methods specified in `bodyParserConfig.acceptMethods`.
 * This is done using `BodyParserExtension` in `BODY_PARSER_EXTENSIONS` group.
 */
@Module({
  extensions: [[BODY_PARSER_EXTENSIONS, PRE_ROUTER_EXTENSIONS, BodyParserExtension, true]],
})
export class BodyParserModule {}
