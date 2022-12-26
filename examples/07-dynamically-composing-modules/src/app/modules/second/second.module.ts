import { featureModule, Providers } from '@ditsmod/core';

import { SecondController } from './second.controller';

@featureModule({
  controllers: [SecondController],
  providersPerMod: [...new Providers().useLogConfig({ level: 'debug' })],
})
export class SecondModule {}
