import { featureModule } from '@ditsmod/core';
import { RestModule } from '@ditsmod/rest';

import { SecondModule } from '../second/second.module.js';
import { ThirdController } from './third.controler.js';
import { ThirdService } from './three.service.js';

@featureModule({
  imports: [RestModule, SecondModule],
  controllers: [ThirdController],
  providersPerReq: [ThirdService],
  exports: [ThirdService],
})
export class ThirdModule {}
