import { rootModule, HttpErrorHandler } from '@ditsmod/core';

import { MyHttpErrorHandler } from './my-http-error-handler.js';
import { SomeModule } from './modules/some/some.module.js';

@rootModule({
  appends: [SomeModule],
  providersPerReq: [{ token: HttpErrorHandler, useClass: MyHttpErrorHandler }],
  exports: [HttpErrorHandler],
})
export class AppModule {}
