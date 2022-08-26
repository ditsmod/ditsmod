import { LoggerConfig, Module, Providers } from '@ditsmod/core';

import { SomeController } from './some.controller';

@Module({
  controllers: [SomeController],
  providersPerMod: [
    ...new Providers().useValue(LoggerConfig, new LoggerConfig('trace'))
  ],
})
export class SomeModule {}
