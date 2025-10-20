import { restModule } from '@ditsmod/rest';
import { MulterExtendedOptions } from '@ditsmod/body-parser';

import { SomeController } from './some/some.controller.js';
import { CtxController } from './some/some-ctx.controller.js';

const multerOptions: MulterExtendedOptions = { limits: { files: 20 }, errorLogLevel: 'debug' };

@restModule({
  providersPerMod: [{ token: MulterExtendedOptions, useValue: multerOptions }],
  controllers: [SomeController, CtxController],
})
export class SomeModule {}
