import { featureModule } from '@ditsmod/core';
import { RestModule } from '@ditsmod/rest';

import { SomeLogMediator } from './some-log-mediator.js';
import { SomeService } from './some.service.js';

@featureModule({
  imports: [RestModule],
  providersPerMod: [SomeLogMediator, SomeService],
  exports: [SomeService]
})
export class SomeModule {}
