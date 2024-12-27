import { rootModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { Module1 } from './modules/module1/module1.js';
import { Module2 } from './modules/module2/module2.js';
import { Controller1 } from './controllers.js';
import { Module3 } from './modules/module3/module3.js';
import { Guard, GuardPerRou } from './guards.js';

@rootModule({
  imports: [RoutingModule],
  controllers: [Controller1],
  providersPerRou: [GuardPerRou, { token: Guard, useClass: GuardPerRou }],
  providersPerReq: [Guard],
  appends: [
    { path: 'module1', module: Module1 },
    { path: 'module2-with-guard', module: Module2, guards: [Guard] },
    { path: 'module3', module: Module3 },
  ],
  exports: [Guard, GuardPerRou],
})
export class AppModule {}
