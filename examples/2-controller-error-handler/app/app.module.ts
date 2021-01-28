import { RootModule, ControllerErrorHandler } from '@ts-stack/ditsmod';

import { MyControllerErrorHandler } from './my-controller-error-handler';
import { SomeModule } from './modules/some/some.module';

@RootModule({
  imports: [SomeModule],
  providersPerReq: [{ provide: ControllerErrorHandler, useClass: MyControllerErrorHandler }],
  exports: [{ provide: ControllerErrorHandler, useClass: MyControllerErrorHandler }],
})
export class AppModule {}
