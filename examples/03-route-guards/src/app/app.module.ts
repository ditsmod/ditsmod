import { Providers, rootModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { Module1 } from './modules/module1/module1.js';
import { Module2 } from './modules/module2/module2.js';
import { BearerGuard } from './modules/auth/bearer.guard.js';
import { Controller1 } from './controller1.js';
import { Module3 } from './modules/module3/module3.js';

@rootModule({
  imports: [RoutingModule],
  controllers: [Controller1],
  appends: [Module1, { path: 'guards-1', module: Module2, guards: [BearerGuard] }, { path: '', module: Module3 }],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
