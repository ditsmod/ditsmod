import { featureModule } from '@ditsmod/core';
import { SecondModule } from '../second/second.module';

import { ThirdController } from './third.controler';
import { ThirdService } from './three.service';

@featureModule({
  imports: [SecondModule],
  controllers: [ThirdController],
  providersPerReq: [ThirdService],
  exports: [ThirdService],
})
export class ThirdModule {}
