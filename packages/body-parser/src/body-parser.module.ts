import { edk, Module } from '@ditsmod/core';

import { BodyParserExtension, BODY_PARSER_EXTENSIONS } from './body-parser.extension';

@Module({
  extensions: [
    BodyParserExtension,
    { provide: BODY_PARSER_EXTENSIONS, useExisting: BodyParserExtension, multi: true },
    { provide: `BEFORE ${edk.PRE_ROUTER_EXTENSIONS}`, useExisting: BodyParserExtension, multi: true },
  ],
  exports: [BODY_PARSER_EXTENSIONS, BodyParserExtension, `BEFORE ${edk.PRE_ROUTER_EXTENSIONS}`],
})
export class BodyParserModule {}
