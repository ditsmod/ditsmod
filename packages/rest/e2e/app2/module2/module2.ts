import { featureModule } from '@ditsmod/core';

import { route } from '#decorators/route.js';
import { RestModule } from '#init/rest.module.js';
import { controller } from '#types/controller.js';
import { mixinRest } from '#decorators/rest-module-mixins.js';

@controller()
class Controller2 {
  @route('GET', 'controller2')
  method1() {
    return 'controller2';
  }
}

@mixinRest({ controllers: [Controller2] })
@featureModule({
  imports: [RestModule],
})
export class Module2 {}
