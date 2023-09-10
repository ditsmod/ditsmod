import { featureModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { SomeLogMediator } from './some-log-mediator.js';
import { SomeService } from './some.service.js';

@featureModule({
  imports: [RouterModule],
  providersPerMod: [SomeLogMediator, SomeService],
  exports: [SomeService]
})
export class SomeModule {}
