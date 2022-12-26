import { featureModule } from '@ditsmod/core';
import { BodyParserModule } from '@ditsmod/body-parser';

import { FirstController } from './first.controler';
import { FirstPerRouService } from './first-per-rou.service';
import { FirstService } from './first.service';
import { FirstMultiProviderService } from './first-multi-provider.service';

@featureModule({
  imports: [BodyParserModule],
  controllers: [FirstController],
  providersPerRou: [FirstPerRouService],
  providersPerReq: [FirstService, { token: 'multi-provider', useClass: FirstMultiProviderService, multi: true }],
  exports: [FirstService, FirstPerRouService, BodyParserModule, 'multi-provider'],
})
export class FirstModule {}
