import { FilterConfig, LoggerConfig, LogMediatorConfig, RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { SecondModule } from './modules/routed/second/second.module';
import { FirstModule } from './modules/service/first/first.module';

const loggerConfig = new LoggerConfig('info');
const filterConfig: FilterConfig = { modulesNames: ['SecondModule'] };

@RootModule({
  providersPerApp: [
    { provide: LoggerConfig, useValue: loggerConfig },
    // { provide: LogMediatorConfig, useValue: { filterConfig } },
  ],
  imports: [RouterModule, { path: '', module: FirstModule }, { path: '', module: SecondModule }],
})
export class AppModule {}
