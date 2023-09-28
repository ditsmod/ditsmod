import { rootModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { AppController } from './app.controller.js';
import { FirstModule } from './first/first.module.js';
import { SecondModule } from './second/second.module.js';
import { ThirdModule } from './third/third.module.js';

@rootModule({
  imports: [
    RoutingModule,
    { path: '', module: FirstModule },
    { path: '', module: SecondModule },
    { path: '', module: ThirdModule },
  ],
  controllers: [AppController],
})
export class AppModule {}
