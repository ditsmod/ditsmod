import { Module } from '@ts-stack/ditsmod';

import { HelloController } from './hello.controller';

@Module({
  controllers: [HelloController],
})
export class UserModule {}
