import { Providers, rootModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { AppController } from './app.controller.js';
import { FirstModule } from './first/first.module.js';
import { SecondModule } from './second/second.module.js';
import { ThirdModule } from './third/third.module.js';

@initRest({
  imports: [
    { path: '', module: FirstModule },
    { path: '', module: SecondModule },
    { path: '', module: ThirdModule },
  ],
  controllers: [AppController],
})
@rootModule()
export class AppModule {}
