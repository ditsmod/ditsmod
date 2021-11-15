import { Module } from '@ditsmod/core';

import { OneModule } from '../one/one.module';
import { TwoService } from './two.service';

@Module({
  imports: [OneModule],
  providersPerReq: [TwoService],
  exports: [TwoService],
})
export class TwoModule {}
