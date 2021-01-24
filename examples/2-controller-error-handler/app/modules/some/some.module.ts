import { Module } from '@ts-stack/ditsmod';

import { SomeController } from './some.controller';

@Module({
  controllers: [SomeController],
})
export class SomeModule {}
