import { RootModule, Router } from '@ts-stack/ditsmod';
import { DefaultRouter } from '@ts-stack/router';

import { SomeModule } from './modules/some/some.module';
import { AuthModule } from './modules/auth/auth.module';

@RootModule({
  imports: [SomeModule],
  exports: [AuthModule],
  providersPerApp: [{ provide: Router, useClass: DefaultRouter }]
})
export class AppModule {}
