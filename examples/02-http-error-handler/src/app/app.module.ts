import { rootModule, Providers } from '@ditsmod/core';
import { HttpErrorHandler, addRest } from '@ditsmod/rest';

import { MyHttpErrorHandler } from './my-http-error-handler.js';
import { SomeModule } from './modules/some/some.module.js';

@addRest({
  appends: [SomeModule],
  providersPerRou: [{ token: HttpErrorHandler, useClass: MyHttpErrorHandler }],
  exports: [HttpErrorHandler],
})
@rootModule({
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
