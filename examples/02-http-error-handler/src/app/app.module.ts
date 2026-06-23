import { LoggerConfig, Providers } from '@ditsmod/core';
import { HttpErrorHandler, restRootModule } from '@ditsmod/rest';

import { MyHttpErrorHandler } from './my-http-error-handler.js';
import { SomeModule } from './modules/some.module.js';

@restRootModule({
  appends: [SomeModule],
  providersPerApp: new Providers().useValue(LoggerConfig, { level: 'info' }),
  providersPerRou: [{ token: HttpErrorHandler, useClass: MyHttpErrorHandler }],
  exports: [HttpErrorHandler],
})
export class AppModule {}
