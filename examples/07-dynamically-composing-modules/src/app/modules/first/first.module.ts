import { featureModule } from '@ditsmod/core';

import { FirstController } from './first.controller.js';

@featureModule({ controllers: [FirstController] })
export class FirstModule {}
