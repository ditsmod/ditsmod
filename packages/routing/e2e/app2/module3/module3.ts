import { featureModule } from '@ditsmod/core';

import { route } from '#mod/decorators/route.js';
import { RoutingModule } from '#mod/routing.module.js';
import { controller } from '#mod/controller.js';

@controller()
class Controller3 {
  @route('GET', 'controller3')
  method1() {
    return 'controller3';
  }
}

@featureModule({
  imports: [RoutingModule],
  controllers: [Controller3],
})
export class Module3 {}
