import { featureModule } from '@ditsmod/core';
import { DictService } from '@ditsmod/i18n';

import { FirstModule } from '../first/first.module';
import { MyDictService } from './dict.service';
import { ThirdController } from './third.controller';

@featureModule({
  imports: [FirstModule],
  controllers: [ThirdController],
  providersPerReq: [{ token: DictService, useClass: MyDictService }],
})
export class ThirdModule {}
