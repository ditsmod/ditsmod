import { Providers, rootModule } from '@ditsmod/core';
import { RestModule } from '@ditsmod/rest';

import { AppController } from './app.controller.js';
import { FirstModule } from './first/first.module.js';
import { SecondModule } from './second/second.module.js';
import { ThirdModule } from './third/third.module.js';

@rootModule({
  imports: [
    RestModule,
    { path: '', module: FirstModule },
    { path: '', module: SecondModule },
    { path: '', module: ThirdModule },
  ],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  controllers: [AppController],
})
export class AppModule {}
