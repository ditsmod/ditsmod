import { featureModule } from '@ditsmod/core';
import { RestModule, addRest } from '@ditsmod/rest';
import { BodyParserModule, MulterExtendedOptions } from '@ditsmod/body-parser';

import { SomeController } from './some.controller.js';
import { CtxController } from './some-ctx.controller.js';

const multerOptions: MulterExtendedOptions = { limits: { files: 20 }, errorLogLevel: 'debug' };

@addRest({ controllers: [SomeController, CtxController] })
@featureModule({
  imports: [RestModule, BodyParserModule],
  providersPerMod: [{ token: MulterExtendedOptions, useValue: multerOptions }],
})
export class SomeModule {}
