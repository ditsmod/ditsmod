import { featureModule } from '@ditsmod/core';

import { route } from '#decorators/route.js';
import { RestModule } from '#module/rest.module.js';
import { controller } from '#types/controller.js';

@controller()
class Controller2 {
  @route('GET', 'controller2')
  method1() {
    return 'controller2';
  }
}

@featureModule({
  imports: [RestModule],
  controllers: [Controller2],
})
export class Module2 {}