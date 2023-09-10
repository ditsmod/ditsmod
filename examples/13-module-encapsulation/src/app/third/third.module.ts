import { featureModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { SecondModule } from '../second/second.module.js';
import { ThirdController } from './third.controler.js';
import { ThirdService } from './three.service.js';

@featureModule({
  imports: [RouterModule, SecondModule],
  controllers: [ThirdController],
  providersPerReq: [ThirdService],
  exports: [ThirdService],
})
export class ThirdModule {}
