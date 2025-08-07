import { rootModule, Providers } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { MyLogMediator } from './my-log-mediator.js';
import { SomeModule } from './modules/some.module.js';
import { OtherModule } from './modules/other.module.js';

@initRest({
  imports: [SomeModule],
  providersPerApp: new Providers()
    .useSystemLogMediator(MyLogMediator) // This allow use MyLogMediator internaly in Ditsmod core
    .useLogConfig({ level: 'info' }),
  appends: [OtherModule],
})
@rootModule()
export class AppModule {}
