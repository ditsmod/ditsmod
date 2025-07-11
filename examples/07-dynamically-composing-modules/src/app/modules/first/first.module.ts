import { featureModule } from '@ditsmod/core';
import { RestModule, addRest } from '@ditsmod/rest';

import { FirstController } from './first.controller.js';

@addRest({ controllers: [FirstController] })
@featureModule({
  imports: [RestModule],
})
export class FirstModule {}
