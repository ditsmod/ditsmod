import { rootModule } from '@ditsmod/core';
import { FirstModule } from './modules/first/first.module.js';

@rootModule({
  appends: [FirstModule]
})
export class AppModule {}
