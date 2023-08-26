import { featureModule, Providers } from '@ditsmod/core';

import { SecondController } from './second.controller.js';

@featureModule({
  controllers: [SecondController],
  providersPerMod: [...new Providers().useLogConfig({ level: 'debug' })],
})
export class SecondModule {}
