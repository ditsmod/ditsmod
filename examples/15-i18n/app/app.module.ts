import { FilterConfig, LoggerConfig, LogMediatorConfig, RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { SecondModule } from './modules/second/second.module';

const loggerConfig = new LoggerConfig('info');
const filterConfig: FilterConfig = { modulesNames: ['SecondModule'] };

@RootModule({
  providersPerApp: [
    { provide: LoggerConfig, useValue: loggerConfig },
    // { provide: LogMediatorConfig, useValue: { filterConfig } },
  ],
  imports: [RouterModule, { path: '', module: SecondModule }],
})
export class AppModule {}
