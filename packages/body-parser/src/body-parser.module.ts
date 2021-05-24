import { edk, Module } from '@ditsmod/core';

import { BodyParserExtension, BODY_PARSER_EXTENSIONS } from './body-parser.extension';

@Module({
  providersPerApp: [
    BodyParserExtension,
    { provide: BODY_PARSER_EXTENSIONS, useExisting: BodyParserExtension, multi: true },
    { provide: `BEFORE ${edk.PRE_ROUTER_EXTENSIONS}`, useExisting: BodyParserExtension, multi: true },
  ],
  extensions: [BODY_PARSER_EXTENSIONS],
})
export class BodyParserModule {}
