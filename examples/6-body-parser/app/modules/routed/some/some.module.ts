import { Module, BodyParserConfig } from '@ts-stack/ditsmod';

import { SomeController } from './some.controller';
import { SomeBodyParserConfig } from './some-body-parser-config.service';

@Module({
  controllers: [SomeController],
  providersPerMod: [{ provide: BodyParserConfig, useClass: SomeBodyParserConfig }],
})
export class SomeModule {}
