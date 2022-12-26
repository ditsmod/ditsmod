import { featureModule } from '@ditsmod/core';

import { FirstController } from './first.controller';

@featureModule({
  controllers: [FirstController],
})
export class FirstModule {}
