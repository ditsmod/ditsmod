import { RootModule, Router } from '@ditsmod/core';
import { DefaultRouter } from '@ts-stack/router';

import { SomeModule } from './modules/some/some.module';
import { AuthModule } from './modules/auth/auth.module';

@RootModule({
  imports: [SomeModule],
  providersPerApp: [{ provide: Router, useClass: DefaultRouter }],
  exports: [AuthModule],
})
export class AppModule {}
