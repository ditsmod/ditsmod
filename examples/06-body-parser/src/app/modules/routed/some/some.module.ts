import { featureModule } from '@ditsmod/core';
import { RoutingModule } from '@ditsmod/routing';
import { BodyParserModule, MulterExtendedOptions } from '@ditsmod/body-parser';

import { SomeController } from './some.controller.js';
import { CtxController } from './some-ctx.controller.js';

const multerOptions: MulterExtendedOptions = { limits: { files: 20 }, errorLogLevel: 'debug' };

@featureModule({
  imports: [RoutingModule, BodyParserModule],
  controllers: [SomeController, CtxController],
  providersPerMod: [
    { token: MulterExtendedOptions, useValue: multerOptions }
  ],
})
export class SomeModule {}
