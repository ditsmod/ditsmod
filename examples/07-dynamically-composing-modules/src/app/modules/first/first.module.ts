import { featureModule } from '@ditsmod/core';
import { RestModule, initRest } from '@ditsmod/rest';

import { FirstController } from './first.controller.js';

@initRest({ controllers: [FirstController] })
@featureModule({
  imports: [RestModule],
})
export class FirstModule {}
