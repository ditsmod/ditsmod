import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { SomeLogMediator } from './some-log-mediator.js';
import { SomeService } from './some.service.js';

@featureModule({
  imports: [RoutingModule],
  providersPerMod: [SomeLogMediator, SomeService],
  exports: [SomeService]
})
export class SomeModule {}
