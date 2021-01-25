import { Module, BodyParser } from '@ts-stack/ditsmod';

import { BodyParserService } from './body-parser.service';

@Module({
  providersPerReq: [BodyParser],
  exports: [{ provide: BodyParser, useClass: BodyParserService }],
})
export class BodyParserModule {}
