import { featureModule, Providers } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { SecondController } from './second.controller.js';

@featureModule({
  imports: [RoutingModule],
  controllers: [SecondController],
  providersPerMod: [...new Providers().useLogConfig({ level: 'debug' })],
})
export class SecondModule {}
