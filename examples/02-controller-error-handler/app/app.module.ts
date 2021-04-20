import { Router, RootModule, ControllerErrorHandler } from '@ditsmod/core';
import { DefaultRouter } from '@ditsmod/router';

import { MyControllerErrorHandler } from './my-controller-error-handler';
import { SomeModule } from './modules/some/some.module';

@RootModule({
  imports: [SomeModule],
  providersPerReq: [ControllerErrorHandler],
  exports: [{ provide: ControllerErrorHandler, useClass: MyControllerErrorHandler }],
  providersPerApp: [{ provide: Router, useClass: DefaultRouter }]
})
export class AppModule {}
