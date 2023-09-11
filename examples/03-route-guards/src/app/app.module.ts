import { rootModule } from '@ditsmod/core';

import { SomeModule } from './modules/some/some.module.js';

@rootModule({
  appends: [SomeModule],
})
export class AppModule {}
