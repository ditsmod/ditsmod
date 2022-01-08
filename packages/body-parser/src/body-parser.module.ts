import { Module, PRE_ROUTER_EXTENSIONS } from '@ditsmod/core';

import { BodyParserExtension, BODY_PARSER_EXTENSIONS } from './body-parser.extension';

@Module({
  extensions: [[PRE_ROUTER_EXTENSIONS, BODY_PARSER_EXTENSIONS, BodyParserExtension, true]],
})
export class BodyParserModule {}
