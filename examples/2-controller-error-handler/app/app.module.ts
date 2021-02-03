import { Router, RootModule, ControllerErrorHandler } from '@ts-stack/ditsmod';
import { DefaultRouter } from '@ts-stack/router';

import { MyControllerErrorHandler } from './my-controller-error-handler';
import { SomeModule } from './modules/some/some.module';

@RootModule({
  imports: [SomeModule],
  providersPerReq: [{ provide: ControllerErrorHandler, useClass: MyControllerErrorHandler }],
  exports: [{ provide: ControllerErrorHandler, useClass: MyControllerErrorHandler }],
  providersPerApp: [{ provide: Router, useClass: DefaultRouter }]
})
export class AppModule {}
