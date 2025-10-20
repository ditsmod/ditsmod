import { Providers } from '@ditsmod/core';
import { restModule } from '@ditsmod/rest';

import { SomeController } from './some/some.controller.js';

@restModule({ providersPerMod: new Providers().useLogConfig({ level: 'trace' }), controllers: [SomeController] })
export class SomeModule {}
