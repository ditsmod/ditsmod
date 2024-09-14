import { rootModule, HttpErrorHandler, Providers } from '@ditsmod/core';

import { MyHttpErrorHandler } from './my-http-error-handler.js';
import { SomeModule } from './modules/some/some.module.js';
import { MySingletonHttpErrorHandler } from './my-singleton-http-error-handler.js';

@rootModule({
  appends: [SomeModule],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  providersPerRou: [{ token: HttpErrorHandler, useClass: MySingletonHttpErrorHandler }],
  providersPerReq: [{ token: HttpErrorHandler, useClass: MyHttpErrorHandler }],
  exports: [HttpErrorHandler],
})
export class AppModule {}
