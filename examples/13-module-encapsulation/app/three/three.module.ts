import { Module } from '@ditsmod/core';

import { TwoModule } from '../two/two.module';
import { ThirdController } from './third.controler';
import { ThreeService } from './three.service';

@Module({
  imports: [TwoModule],
  controllers: [ThirdController],
  providersPerReq: [ThreeService],
  exports: [ThreeService],
})
export class ThreeModule {}
