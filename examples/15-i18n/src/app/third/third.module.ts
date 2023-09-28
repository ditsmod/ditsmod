import { featureModule } from '@ditsmod/core';
import { DictService } from '@ditsmod/i18n';
import { RoutingModule } from '@ditsmod/routing';

import { FirstModule } from '../first/first.module.js';
import { MyDictService } from './dict.service.js';
import { ThirdController } from './third.controller.js';

@featureModule({
  imports: [RoutingModule, FirstModule],
  controllers: [ThirdController],
  providersPerReq: [{ token: DictService, useClass: MyDictService }],
})
export class ThirdModule {}
