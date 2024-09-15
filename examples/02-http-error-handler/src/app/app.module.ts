import { rootModule, HttpErrorHandler, Providers } from '@ditsmod/core';

import { MyHttpErrorHandler } from './my-http-error-handler.js';
import { SomeModule } from './modules/some/some.module.js';

@rootModule({
  appends: [SomeModule],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  providersPerRou: [{ token: HttpErrorHandler, useClass: MyHttpErrorHandler }],
  exports: [HttpErrorHandler],
})
export class AppModule {}
