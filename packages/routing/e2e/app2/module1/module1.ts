import { featureModule } from '@ditsmod/core';

import { route } from '#decorators/route.js';
import { RoutingModule } from '#module/routing.module.js';
import { controller } from '#types/controller.js';

@controller()
class Controller1 {
  @route('GET', 'controller1')
  method1() {
    return 'controller1';
  }
}

@featureModule({
  imports: [RoutingModule],
  controllers: [Controller1],
})
export class Module1 {}