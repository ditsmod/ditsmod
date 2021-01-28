import { RootModule, BodyParser } from '@ts-stack/ditsmod';

import { BodyParserModule } from './modules/body-parser/body-parser.module';
import { BodyParserService } from './modules/body-parser/body-parser.service';
import { SomeModule } from './modules/some/some.module';

@RootModule({
  imports: [SomeModule],
  providersPerReq: [{ provide: BodyParser, useClass: BodyParserService }],
  exports: [BodyParserModule],
})
export class AppModule {}
