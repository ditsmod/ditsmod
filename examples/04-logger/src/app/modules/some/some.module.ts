import { featureModule, Providers } from '@ditsmod/core';

import { SomeController } from './some.controller.js';

@featureModule({
  controllers: [SomeController],
  providersPerMod: [
    ...new Providers().useLogConfig({ level: 'trace' })
  ],
})
export class SomeModule {}
