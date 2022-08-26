import { RootModule, LogMediator, LogFilter, LoggerConfig, Providers } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { MyLogMediator } from './my-log-mediator';
import { SomeModule } from './modules/some/some.module';
import { OtherModule } from './modules/other/other.module';

@RootModule({
  imports: [RouterModule, { path: '', module: SomeModule }, { path: '', module: OtherModule }],
  providersPerApp: [
    MyLogMediator, // This allow use MyLogMediator in this application
    ...new Providers()
      .useClass(LogMediator, MyLogMediator) // This allow use MyLogMediator internaly in Ditsmod core
      .useValue(LoggerConfig, new LoggerConfig('trace'))
      .useValue(LogFilter, { classesNames: ['PreRouterExtension'] }),
  ],
})
export class AppModule {}
