import { featureModule } from '@ditsmod/core';

import { route } from '#decorators/route.js';
import { RestModule } from '#init/rest.module.js';
import { controller } from '#types/controller.js';
import { addRest } from '#decorators/rest-metadata.js';

@controller()
class Controller1 {
  @route('GET', 'controller1')
  method1() {
    return 'controller1';
  }
}

@addRest({ controllers: [Controller1] })
@featureModule({
  imports: [RestModule],
})
export class Module1 {}
