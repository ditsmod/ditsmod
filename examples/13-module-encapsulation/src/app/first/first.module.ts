import { featureModule } from '@ditsmod/core';
import { BodyParserModule } from '@ditsmod/body-parser';
import { RestModule } from '@ditsmod/rest';

import { FirstController } from './first.controler.js';
import { FirstPerRouService } from './first-per-rou.service.js';
import { FirstService } from './first.service.js';
import { FirstMultiProviderService } from './first-multi-provider.service.js';

@featureModule({
  imports: [RestModule, BodyParserModule],
  controllers: [FirstController],
  providersPerRou: [FirstPerRouService],
  providersPerReq: [FirstService, { token: 'multi-provider', useClass: FirstMultiProviderService, multi: true }],
  exports: [FirstService, FirstPerRouService, BodyParserModule, 'multi-provider'],
})
export class FirstModule {}
