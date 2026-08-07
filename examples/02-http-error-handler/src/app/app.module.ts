import { LoggerConfig, ProviderBuilder } from '@holu/core';
import { HttpErrorHandler, restRootModule } from '@holu/rest';

import { MyHttpErrorHandler } from './my-http-error-handler.js';
import { SomeModule } from './modules/some.module.js';

@restRootModule({
  appends: [SomeModule],
  providersPerApp: new ProviderBuilder().useValue(LoggerConfig, { level: 'info' }),
  providersPerRou: [{ token: HttpErrorHandler, useClass: MyHttpErrorHandler }],
  exports: [HttpErrorHandler],
})
export class AppModule {}
