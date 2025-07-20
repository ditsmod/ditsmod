import { featureModule, Providers } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { SecondController } from './second.controller.js';

@initRest({ controllers: [SecondController] })
@featureModule({
  providersPerMod: new Providers().useLogConfig({ level: 'debug' }),
})
export class SecondModule {}
