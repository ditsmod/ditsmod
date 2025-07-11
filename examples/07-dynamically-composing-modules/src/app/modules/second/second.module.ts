import { featureModule, Providers } from '@ditsmod/core';
import { RestModule, addRest } from '@ditsmod/rest';

import { SecondController } from './second.controller.js';

@addRest({ controllers: [SecondController] })
@featureModule({
  imports: [RestModule],
  providersPerMod: new Providers().useLogConfig({ level: 'debug' }),
})
export class SecondModule {}
