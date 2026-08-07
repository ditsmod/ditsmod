import { featureModule } from '@holu/core';

import { route } from '#decorators/route.js';
import { RestModule } from '#init/rest.module.js';
import { controller } from '#types/controller.js';
import { mixinRest } from '#decorators/rest-module-mixins.js';

@controller()
class Controller3 {
  @route('GET', 'controller3')
  method1() {
    return 'controller3';
  }
}

@mixinRest({ controllers: [Controller3] })
@featureModule({
  imports: [RestModule],
})
export class Module3 {}
