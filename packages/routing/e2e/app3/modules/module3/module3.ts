import { featureModule } from '@ditsmod/core';
import { restMetadata, RoutingModule } from '@ditsmod/routing';

import { Controller1, Controller2 } from './controllers.js';
import { Module2 } from '../module2/module2.js';
import { Guard, GuardPerRou } from '../../guards.js';

@restMetadata({
  providersPerRou: [{ token: Guard, useClass: GuardPerRou }],
  providersPerReq: [Guard],
  appends: [
    {
      //
      path: 'module2-with-guard',
      module: Module2,
      // guards: [Guard],
    },
  ],
  controllers: [Controller1, Controller2],
})
@featureModule({imports: [RoutingModule]})
export class Module3 {}
