import { controller, rootModule } from '@ditsmod/core';

import { route } from '#mod/decorators/route.js';
import { RoutingModule } from '#mod/routing.module.js';
import { Module1 } from './module1/module1.js';
import { Module2 } from './module2/module2.js';
import { Module3 } from './module3/module3.js';

@controller()
class Controller0 {
  @route('GET', 'controller0')
  method1() {
    return 'controller0';
  }
}

@rootModule({
  imports: [
    RoutingModule,
    // Allow slash for absolutePath.
    { absolutePath: '/module1', module: Module1 },
    { path: 'module3', module: Module3 },
  ],
  appends: [Module2, { path: 'module2', module: Module2 }],
  controllers: [Controller0],
})
export class AppModule {}
