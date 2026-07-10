import { LoggerConfig, ProviderBuilder } from '@ditsmod/core';
import { restModule } from '@ditsmod/rest';

import { SecondController } from './second/second.controller.js';

@restModule({
  controllers: [SecondController],
  providersPerMod: new ProviderBuilder().useValue(LoggerConfig, { level: 'debug' }),
})
export class SecondModule {}
