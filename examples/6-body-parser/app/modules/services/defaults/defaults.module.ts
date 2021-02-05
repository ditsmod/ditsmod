import { BodyParser, Module, Router } from '@ts-stack/ditsmod';
import { DefaultRouter } from '@ts-stack/router';
import { DefaultBodyParser } from '@ts-stack/body-parser';

@Module({
  providersPerApp: [{ provide: Router, useClass: DefaultRouter }],
  providersPerReq: [BodyParser],
  exports: [{ provide: BodyParser, useClass: DefaultBodyParser }]
})
export class DefaultsModule {}
