import { restRootModule } from '@ditsmod/rest';

import { Controller1, Controller2 } from './controllers.js';
import { Guard, GuardPerRou } from '../../guards.js';

@restRootModule({
  providersPerRou: [{ token: Guard, useClass: GuardPerRou }],
  providersPerReq: [Guard],
  controllers: [Controller1, Controller2],
})
export class Module1 {}
