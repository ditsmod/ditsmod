import { restModule } from '@ditsmod/rest';
import { MulterExtendedOptions } from '@ditsmod/body-parser';

import { RequestScopedController } from './some/some.controller.js';
import { RouteScopedController } from './some/some-ctx.controller.js';

const multerOptions: MulterExtendedOptions = { limits: { files: 20 }, errorLogLevel: 'debug' };

@restModule({
  providersPerMod: [{ token: MulterExtendedOptions, useValue: multerOptions }],
  controllers: [RequestScopedController, RouteScopedController],
})
export class SomeModule {}
