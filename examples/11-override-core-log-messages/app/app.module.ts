import { RootModule, LogMediator, LogMediatorConfig, FilterConfig, LoggerConfig } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { MyLogMediator } from './my-log-mediator';
import { SomeModule } from './modules/some/some.module';
import { OtherModule } from './modules/other/other.module';

const loggerConfig = new LoggerConfig('info');
const filterConfig: FilterConfig = { modulesNames: ['OtherModule'] };

@RootModule({
  imports: [
    RouterModule,
    { path: '', module: SomeModule },
    { path: '', module: OtherModule },
  ],
  providersPerApp: [
    MyLogMediator, // This allow use MyLogMediator in this application
    { provide: LogMediator, useClass: MyLogMediator }, // This allow use MyLogMediator internaly in Ditsmod core
    { provide: LoggerConfig, useValue: loggerConfig },
    // { provide: LogMediatorConfig, useValue: { filterConfig } }, // Uncomment this to see only logs from OtherModule
  ],
})
export class AppModule {}
