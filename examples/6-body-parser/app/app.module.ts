import { RootModule, BodyParser } from '@ts-stack/ditsmod';

import { BodyParserModule } from './modules/body-parser/body-parser.module';
import { SomeModule } from './modules/some/some.module';

@RootModule({
  imports: [SomeModule],
  providersPerReq: [BodyParser],
  exports: [BodyParserModule],
})
export class AppModule {}
