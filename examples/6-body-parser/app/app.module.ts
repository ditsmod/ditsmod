import { RootModule, BodyParser } from '@ts-stack/ditsmod';

import { BodyParserModule } from './modules/body-parser/body-parser.module';
import { SomeModule } from './modules/some/some.module';

@RootModule({
  providersPerReq: [BodyParser],
  imports: [SomeModule],
  exports: [BodyParserModule],
})
export class AppModule {}
