import { Module, Providers } from '@ditsmod/core';

import { SecondController } from './second.controller';

@Module({
  controllers: [SecondController],
  providersPerMod: [...new Providers().useLogConfig({ level: 'debug' })],
})
export class SecondModule {}
