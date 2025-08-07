import { featureModule, Providers } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { SomeModule } from './some.module.js';
import { SomeLogMediator } from './some/some-log-mediator.js';
import { OtherController } from './other/other.controller.js';
import { OtherLogMediator } from './other/other-log-mediator.js';

@initRest({
  imports: [SomeModule],
  providersPerMod: new Providers().useClass(SomeLogMediator, OtherLogMediator),
  controllers: [OtherController],
})
@featureModule()
export class OtherModule {}
