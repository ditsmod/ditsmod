import { ProviderBuilder } from '@ditsmod/core';
import { restModule } from '@ditsmod/rest';

import { SomeModule } from './some.module.js';
import { SomeLogMediator } from './some/some-log-mediator.js';
import { OtherController } from './other/other.controller.js';
import { OtherLogMediator } from './other/other-log-mediator.js';

@restModule({
  imports: [SomeModule],
  providersPerMod: new ProviderBuilder().useClass(SomeLogMediator, OtherLogMediator),
  controllers: [OtherController],
})
export class OtherModule {}
