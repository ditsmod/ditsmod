import { featureModule } from '@ditsmod/core';

import { SomeLogMediator } from './some-log-mediator';
import { SomeService } from './some.service';

@featureModule({
  providersPerMod: [SomeLogMediator, SomeService],
  exports: [SomeService]
})
export class SomeModule {}
