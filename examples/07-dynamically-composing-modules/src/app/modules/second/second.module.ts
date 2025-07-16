import { featureModule, Providers } from '@ditsmod/core';
import { RestModule, initRest } from '@ditsmod/rest';

import { SecondController } from './second.controller.js';

@initRest({ controllers: [SecondController] })
@featureModule({
  imports: [RestModule],
  providersPerMod: new Providers().useLogConfig({ level: 'debug' }),
})
export class SecondModule {}
