import { featureModule, Providers } from '@ditsmod/core';
import { RestModule } from '@ditsmod/rest';

import { SecondController } from './second.controller.js';

@featureModule({
  imports: [RestModule],
  controllers: [SecondController],
  providersPerMod: new Providers().useLogConfig({ level: 'debug' }),
})
export class SecondModule {}
