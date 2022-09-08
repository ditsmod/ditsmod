import { Module } from '@ditsmod/core';

import { SecondController } from './second.controller';

@Module({
  controllers: [SecondController]
})
export class SecondModule {}