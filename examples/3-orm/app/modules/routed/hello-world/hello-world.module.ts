import { Module } from '@ts-stack/mod';

import { HelloWorldController } from './hello-world.controller';

@Module({
  controllers: [HelloWorldController]
})
export class HelloWorldModule {}
