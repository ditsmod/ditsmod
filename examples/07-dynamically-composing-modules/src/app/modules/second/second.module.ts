import { featureModule, Providers } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { SecondController } from './second.controller.js';

@featureModule({
  imports: [RouterModule],
  controllers: [SecondController],
  providersPerMod: [...new Providers().useLogConfig({ level: 'debug' })],
})
export class SecondModule {}
