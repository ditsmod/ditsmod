import { LoggerConfig, Providers } from '@ditsmod/core';
import { restModule } from '@ditsmod/rest';

import { SomeController } from './some/some.controller.js';

@restModule({
  providersPerMod: new Providers().useValue(LoggerConfig, { level: 'trace' }),
  controllers: [SomeController],
})
export class SomeModule {}
