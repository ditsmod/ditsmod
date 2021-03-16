import { RootModule, Router } from '@ditsmod/core';
import { DefaultRouter } from '@ditsmod/router';

import { FirstModule } from './modules/first/first.module';
import { ThirdModule } from './modules/third/third.module';

@RootModule({
  imports: [FirstModule, ThirdModule],
  providersPerApp: [{ provide: Router, useClass: DefaultRouter }],
})
export class AppModule {}
