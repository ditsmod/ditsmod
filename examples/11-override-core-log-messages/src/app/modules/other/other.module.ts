import { featureModule, Providers } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { SomeModule } from '../some/some.module.js';
import { SomeLogMediator } from '../some/some-log-mediator.js';
import { OtherController } from './other.controller.js';
import { OtherLogMediator } from './other-log-mediator.js';

@initRest({ controllers: [OtherController] })
@featureModule({
  imports: [SomeModule],
  providersPerMod: new Providers().useClass(SomeLogMediator, OtherLogMediator),
})
export class OtherModule {}
