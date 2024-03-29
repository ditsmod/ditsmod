import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { FirstModule } from '../first/first.module.js';
import { SecondMultiProviderService } from './second-multi-provider.service.js';
import { SecondController } from './second.controler.js';
import { SecondService } from './second.service.js';

@featureModule({
  imports: [RoutingModule, FirstModule],
  controllers: [SecondController],
  providersPerReq: [SecondService, { token: 'multi-provider', useClass: SecondMultiProviderService, multi: true }],
  exports: [SecondService, 'multi-provider'],
})
export class SecondModule {}
