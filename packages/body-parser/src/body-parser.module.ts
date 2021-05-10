import { BodyParser, edk, Module } from '@ditsmod/core';

import { DefaultBodyParser } from './body-parser';
import { BodyParserExtension, BODY_PARSER_EXTENSIONS } from './body-parser.extension';

@Module({
  providersPerApp: [
    BodyParserExtension,
    { provide: BODY_PARSER_EXTENSIONS, useExisting: BodyParserExtension, multi: true },
    { provide: `BEFORE ${edk.PRE_ROUTER_EXTENSIONS}`, useExisting: BodyParserExtension, multi: true },
  ],
  providersPerReq: [{ provide: BodyParser, useClass: DefaultBodyParser }],
  exports: [{ provide: BodyParser, useClass: DefaultBodyParser }],
  extensions: [],
})
export class BodyParserModule {}
