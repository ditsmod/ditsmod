import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { Controller1 } from './controllers.js';
import { Module2 } from '../module2/module2.js';
import { Guard } from '../../guards.js';

@featureModule({
  imports: [RoutingModule],
  appends: [{ path: 'module2-with-guard', module: Module2, guards: [Guard] }],
  controllers: [Controller1],
})
export class Module3 {}
