import { Module } from '@ditsmod/core';

import { OneService } from './one.service';

@Module({
  providersPerReq: [OneService],
  exports: [OneService],
})
export class OneModule {}
