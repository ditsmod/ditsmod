import { rootModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { FirstModule } from './modules/first/first.module.js';
import { SecondModule } from './modules/second/second.module.js';

@rootModule({
  imports: [RoutingModule],
  appends: [FirstModule, SecondModule]
})
export class AppModule {}
