import { featureModule } from '@ditsmod/core';

import { SomeController } from './some.controller';

@featureModule({
  controllers: [SomeController],
})
export class SomeModule {
}
