import { featureModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { FirstController } from './first/first.controller.js';

@initRest({ controllers: [FirstController] })
@featureModule()
export class FirstModule {}
