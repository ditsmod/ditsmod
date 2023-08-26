import { rootModule, HttpErrorHandler } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { MyHttpErrorHandler } from './my-http-error-handler.js';
import { SomeModule } from './modules/some/some.module.js';

@rootModule({
  imports: [RouterModule],
  appends: [SomeModule],
  providersPerReq: [{ token: HttpErrorHandler, useClass: MyHttpErrorHandler }],
  exports: [HttpErrorHandler],
})
export class AppModule {}
