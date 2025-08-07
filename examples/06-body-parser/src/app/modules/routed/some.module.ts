import { featureModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';
import { BodyParserModule, MulterExtendedOptions } from '@ditsmod/body-parser';

import { SomeController } from './some/some.controller.js';
import { CtxController } from './some/some-ctx.controller.js';

const multerOptions: MulterExtendedOptions = { limits: { files: 20 }, errorLogLevel: 'debug' };

@initRest({
  imports: [BodyParserModule],
  providersPerMod: [{ token: MulterExtendedOptions, useValue: multerOptions }],
  controllers: [SomeController, CtxController],
})
@featureModule()
export class SomeModule {}
