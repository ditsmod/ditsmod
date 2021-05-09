import { Module, Router } from '@ditsmod/core';
import { DefaultRouter } from '@ditsmod/router';
import { BodyParserModule } from '@ditsmod/body-parser';

@Module({
  providersPerApp: [{ provide: Router, useClass: DefaultRouter }],
  exports: [BodyParserModule]
})
export class DefaultsModule {}
