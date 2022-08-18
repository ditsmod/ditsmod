import { Module } from '@ditsmod/core';

import { SomeController } from './some.controller';
import { SomeLogMediator } from './some-log-mediator';

@Module({
  controllers: [SomeController],
  providersPerMod: [SomeLogMediator],
})
export class SomeModule {}
