import { featureModule } from '@ditsmod/core';
import { RestModule } from '@ditsmod/rest';

import { Controller1, Controller2 } from './controllers.js';
import { Guard, GuardPerRou } from '../../guards.js';

@featureModule({
  imports: [RestModule],
  providersPerRou: [{ token: Guard, useClass: GuardPerRou }],
  providersPerReq: [Guard],
  controllers: [Controller1, Controller2],
})
export class Module1 {}
