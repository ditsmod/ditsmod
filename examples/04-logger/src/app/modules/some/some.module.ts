import { featureModule, Providers } from '@ditsmod/core';

import { SomeController } from './some.controller';

@featureModule({
  controllers: [SomeController],
  providersPerMod: [
    ...new Providers().useLogConfig({ level: 'trace' })
  ],
})
export class SomeModule {}
