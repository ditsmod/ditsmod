import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';

import { SomeController } from './some.controller.js';
import { SingletonController } from './singleton-some.controller.js';
import { MulterExtendedOptions, MulterOptions } from '@ditsmod/body-parser';

const multerOptions: MulterExtendedOptions = { limits: { files: 20 }, errorLogLevel: 'debug' };

@featureModule({
  imports: [RoutingModule],
  controllers: [SomeController, SingletonController],
  providersPerRou: [
    { token: MulterExtendedOptions, useValue: multerOptions },
    { token: MulterOptions, useToken: MulterExtendedOptions },
  ],
})
export class SomeModule {}
