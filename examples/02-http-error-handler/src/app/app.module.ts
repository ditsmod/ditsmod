import { rootModule, HttpErrorHandler } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { MyHttpErrorHandler } from './my-controller-error-handler';
import { SomeModule } from './modules/some/some.module';

@rootModule({
  imports: [RouterModule],
  appends: [SomeModule],
  providersPerReq: [{ token: HttpErrorHandler, useClass: MyHttpErrorHandler }],
  exports: [HttpErrorHandler],
})
export class AppModule {}
