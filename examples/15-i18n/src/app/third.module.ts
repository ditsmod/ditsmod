import { restModule } from '@ditsmod/rest';
import { DictService } from '@ditsmod/i18n';

import { FirstModule } from './first.module.js';
import { MyDictService } from './third/dict.service.js';
import { ThirdController } from './third/third.controller.js';

@restModule({
  imports: [FirstModule],
  controllers: [ThirdController],
  providersPerReq: [{ token: DictService, useClass: MyDictService }],
})
export class ThirdModule {}
