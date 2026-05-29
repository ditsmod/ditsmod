import { restRootModule } from '@ditsmod/rest';

import { Controller1, Controller2 } from './controllers.js';
import { Module2 } from '../module2/module2.js';
import { Guard, GuardPerRou } from '../../guards.js';

@restRootModule({
  providersPerRou: [{ token: Guard, useClass: GuardPerRou }],
  providersPerReq: [Guard],
  appends: [
    {
      path: 'module2-with-guard',
      module: Module2,
      guards: [Guard],
    },
  ],
  controllers: [Controller1, Controller2],
})
export class Module3 {}
