import { BodyParser, Module, Router } from '@ditsmod/core';
import { DefaultRouter } from '@ditsmod/router';
import { DefaultBodyParser } from '@ditsmod/body-parser';

@Module({
  providersPerApp: [{ provide: Router, useClass: DefaultRouter }],
  providersPerReq: [BodyParser],
  exports: [{ provide: BodyParser, useClass: DefaultBodyParser }]
})
export class DefaultsModule {}
