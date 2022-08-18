import { Module } from '@ditsmod/core';

import { OtherController } from './other.controller';
import { OtherLogMediator } from './other-log-mediator';

@Module({
  controllers: [OtherController],
  providersPerMod: [OtherLogMediator]
})
export class OtherModule {}
