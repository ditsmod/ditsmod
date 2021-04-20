import { RootModule, Router } from '@ditsmod/core';
import { DefaultRouter } from '@ditsmod/router';

import { FirstModule } from './modules/first/first.module';

@RootModule({
  imports: [FirstModule],
  providersPerApp: [{ provide: Router, useClass: DefaultRouter }],
})
export class AppModule {}
