import { rootModule } from '@ditsmod/core';

import { route } from '#decorators/route.js';
import { RestModule } from '#init/rest.module.js';
import { Module1 } from './module1/module1.js';
import { Module2 } from './module2/module2.js';
import { Module3 } from './module3/module3.js';
import { controller } from '#types/controller.js';
import { initRest } from '#decorators/rest-init-hooks-and-metadata.js';

@controller()
class Controller0 {
  @route('GET', 'controller0')
  method1() {
    return 'controller0';
  }
}

@initRest({
  appends: [Module2, { path: 'module2', module: Module2 }],
  controllers: [Controller0],
  imports: [
    // Allow slash for absolutePath.
    { absolutePath: '/module1', module: Module1 },
    { path: 'module3', module: Module3 },
  ],
})
@rootModule({
  imports: [RestModule],
})
export class AppModule {}
