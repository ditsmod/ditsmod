import { RootModule, ControllerErrorHandler } from '@ts-stack/ditsmod';

import { ErrorHandler } from './error-handler';
import { SomeModule } from './modules/some/some.module';

@RootModule({
  imports: [SomeModule],
  providersPerReq: [ControllerErrorHandler],
  exports: [{ provide: ControllerErrorHandler, useClass: ErrorHandler }],
})
export class AppModule {}
