import { RootModule, BodyParser, Router } from '@ts-stack/ditsmod';
import { DefaultBodyParser } from '@ts-stack/body-parser';
import { DefaultRouter } from '@ts-stack/router';

import { SomeModule } from './modules/some/some.module';

@RootModule({
  imports: [SomeModule],
  providersPerReq: [BodyParser],
  providersPerApp: [{ provide: Router, useClass: DefaultRouter }],
  exports: [{ provide: BodyParser, useClass: DefaultBodyParser }]
})
export class AppModule {}
