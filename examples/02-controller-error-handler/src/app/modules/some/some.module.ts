import { Module } from '@ditsmod/core';

import { SomeController } from './some.controller';

@Module({
  controllers: [SomeController],
})
export class SomeModule {}
