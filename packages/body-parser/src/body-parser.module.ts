import { BodyParser, edk, Module } from '@ditsmod/core';

import { DefaultBodyParser } from './body-parser';
import { BodyParserExtension } from './body-parser.extension';

@Module({
  providersPerApp: [{ provide: `BEFORE ${edk.PRE_ROUTER_EXTENSIONS}`, useClass: BodyParserExtension, multi: true }],
  providersPerReq: [{ provide: BodyParser, useClass: DefaultBodyParser }],
  exports: [{ provide: BodyParser, useClass: DefaultBodyParser }],
  extensions: [],
})
export class BodyParserModule {}
