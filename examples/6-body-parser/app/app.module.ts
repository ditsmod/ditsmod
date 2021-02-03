import { RootModule, BodyParser } from '@ts-stack/ditsmod';
import { DefaultBodyParser } from '@ts-stack/body-parser';

import { SomeModule } from './modules/some/some.module';

@RootModule({
  imports: [SomeModule],
  providersPerReq: [BodyParser],
  exports: [{ provide: BodyParser, useClass: DefaultBodyParser }],
})
export class AppModule {}
