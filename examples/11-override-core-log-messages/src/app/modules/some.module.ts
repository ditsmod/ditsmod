import { featureModule } from '@ditsmod/core';

import { SomeLogMediator } from './some/some-log-mediator.js';
import { SomeService } from './some/some.service.js';

@featureModule({
  providersPerMod: [SomeLogMediator, SomeService],
  exports: [SomeService]
})
export class SomeModule {}
