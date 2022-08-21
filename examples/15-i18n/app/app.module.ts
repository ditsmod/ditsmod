import { FilterConfig, LoggerConfig, LogMediatorConfig, RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { SomeModule } from './modules/some/some.module';

const loggerConfig = new LoggerConfig('info');
const filterConfig: FilterConfig = { modulesNames: ['SomeModule'] };

@RootModule({
  providersPerApp: [
    { provide: LoggerConfig, useValue: loggerConfig },
    // { provide: LogMediatorConfig, useValue: { filterConfig } },
  ],
  imports: [RouterModule, { path: '', module: SomeModule }],
})
export class AppModule {}
