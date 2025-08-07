import { rootModule, Providers } from '@ditsmod/core';
import { HttpErrorHandler, initRest } from '@ditsmod/rest';

import { MyHttpErrorHandler } from './my-http-error-handler.js';
import { SomeModule } from './modules/some.module.js';

@initRest({
  appends: [SomeModule],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  providersPerRou: [{ token: HttpErrorHandler, useClass: MyHttpErrorHandler }],
  exports: [HttpErrorHandler],
})
@rootModule()
export class AppModule {}
