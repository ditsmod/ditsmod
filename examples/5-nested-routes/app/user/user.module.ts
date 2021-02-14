import { Module } from '@ts-stack/ditsmod';

import { HelloWorldController } from './hello-world.controller';

@Module({
  controllers: [HelloWorldController],
})
export class UserModule {}
