import { Module } from '@ditsmod/core';

import { FirstController } from './first.controller';

@Module({
  controllers: [FirstController],
})
export class FirstModule {}
