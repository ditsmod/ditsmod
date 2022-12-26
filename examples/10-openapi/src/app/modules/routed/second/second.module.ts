import { featureModule } from '@ditsmod/core';

import { SecondController } from './second.controller';

@featureModule({
  controllers: [SecondController]
})
export class SecondModule {}