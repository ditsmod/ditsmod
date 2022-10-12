import { HttpBackend, Module } from '@ditsmod/core';
import { ReturnModule } from '@ditsmod/return';

import { SecondController } from './second.controller';

@Module({
  imports: [ReturnModule],
  controllers: [SecondController],
  resolvedCollisionsPerReq: [[HttpBackend, ReturnModule]],
})
export class SecondModule {}
