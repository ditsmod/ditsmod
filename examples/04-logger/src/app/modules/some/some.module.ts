import { Module, Providers } from '@ditsmod/core';

import { SomeController } from './some.controller';

@Module({
  controllers: [SomeController],
  providersPerMod: [
    ...new Providers().useLogConfig({ level: 'trace' })
  ],
})
export class SomeModule {}
