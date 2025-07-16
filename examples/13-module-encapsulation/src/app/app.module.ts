import { Providers, rootModule } from '@ditsmod/core';
import { initRest, RestModule } from '@ditsmod/rest';

import { AppController } from './app.controller.js';
import { FirstModule } from './first/first.module.js';
import { SecondModule } from './second/second.module.js';
import { ThirdModule } from './third/third.module.js';

@initRest({
  appends: [FirstModule, SecondModule, ThirdModule],
  controllers: [AppController],
})
@rootModule({
  imports: [RestModule],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
