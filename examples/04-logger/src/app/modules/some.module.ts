import { LoggerConfig, ProviderBuilder } from '@holu/core';
import { restModule } from '@holu/rest';

import { SomeController } from './some/some.controller.js';

@restModule({
  providersPerMod: new ProviderBuilder().useValue(LoggerConfig, { level: 'trace' }),
  controllers: [SomeController],
})
export class SomeModule {}
