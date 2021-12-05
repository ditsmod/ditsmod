import { edk, Module } from '@ditsmod/core';

import { BodyParserExtension, BODY_PARSER_EXTENSIONS } from './body-parser.extension';

@Module({
  extensions: [[edk.PRE_ROUTER_EXTENSIONS, BODY_PARSER_EXTENSIONS, BodyParserExtension, true]],
})
export class BodyParserModule {}
