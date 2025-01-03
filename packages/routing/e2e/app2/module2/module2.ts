import { controller, featureModule } from '@ditsmod/core';

import { route } from '#mod/decorators/route.js';
import { RoutingModule } from '#mod/routing.module.js';

@controller()
class Controller2 {
  @route('GET', 'controller2')
  method1() {
    return 'controller2';
  }
}

@featureModule({
  imports: [RoutingModule],
  controllers: [Controller2],
})
export class Module2 {}