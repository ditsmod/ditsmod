import { RootModule, ControllerErrorHandler } from '@ts-stack/ditsmod';

import { ErrorHandler } from './error-handler';
import { SomeController } from './some.controller';

@RootModule({
  controllers: [SomeController],
  providersPerReq: [ControllerErrorHandler],
  exports: [{ provide: ControllerErrorHandler, useClass: ErrorHandler }],
})
export class AppModule {}
