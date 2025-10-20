import { Providers } from '@ditsmod/core';
import { restRootModule } from '@ditsmod/rest';

import { MyLogMediator } from './my-log-mediator.js';
import { SomeModule } from './modules/some.module.js';
import { OtherModule } from './modules/other.module.js';

@restRootModule({
  imports: [SomeModule],
  providersPerApp: new Providers()
    .useSystemLogMediator(MyLogMediator) // This allow use MyLogMediator internaly in Ditsmod core
    .useLogConfig({ level: 'info' }),
  appends: [OtherModule],
})
export class AppModule {}
