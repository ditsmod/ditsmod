import { RootModule, ControllerErrorHandler } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { MyControllerErrorHandler } from './my-controller-error-handler';
import { SomeModule } from './modules/some/some.module';

@RootModule({
  imports: [RouterModule, SomeModule],
  providersPerReq: [{ provide: ControllerErrorHandler, useClass: MyControllerErrorHandler }],
  exports: [{ provide: ControllerErrorHandler, useClass: MyControllerErrorHandler }],
})
export class AppModule {}
