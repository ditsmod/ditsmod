import { Module, BodyParser } from '@ts-stack/ditsmod';

import { BodyParserService } from './body-parser.service';

@Module({
  providersPerReq: [{ provide: BodyParser, useClass: BodyParserService }],
  exports: [{ provide: BodyParser, useClass: BodyParserService }],
})
export class BodyParserModule {}
