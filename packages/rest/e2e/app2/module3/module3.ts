import { featureModule } from '@ditsmod/core';

import { route } from '#decorators/route.js';
import { RestModule } from '#module/rest.module.js';
import { controller } from '#types/controller.js';

@controller()
class Controller3 {
  @route('GET', 'controller3')
  method1() {
    return 'controller3';
  }
}

@featureModule({
  imports: [RestModule],
  controllers: [Controller3],
})
export class Module3 {}
