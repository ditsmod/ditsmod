import { rootModule, Providers } from '@ditsmod/core';
import { RestModule } from '@ditsmod/rest';

import { MyLogMediator } from './my-log-mediator.js';
import { SomeModule } from './modules/some/some.module.js';
import { OtherModule } from './modules/other/other.module.js';

@rootModule({
  imports: [RestModule, SomeModule],
  appends: [OtherModule],
  providersPerApp: new Providers()
    .useSystemLogMediator(MyLogMediator) // This allow use MyLogMediator internaly in Ditsmod core
    .useLogConfig({ level: 'info' }),
})
export class AppModule {}
