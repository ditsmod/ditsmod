import { RootModule, BodyParser } from '@ts-stack/ditsmod';

import { SomeModule } from './modules/some/some.module';
import { BodyParserService } from './services-per-app/body-parser.service';

@RootModule({
  imports: [SomeModule],
  providersPerReq: [BodyParser],
  exports: [{ provide: BodyParser, useClass: BodyParserService }],
})
export class AppModule {}
