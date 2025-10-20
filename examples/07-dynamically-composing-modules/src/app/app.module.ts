import { restRootModule } from '@ditsmod/rest';
import { FirstModule } from './modules/first.module.js';

@restRootModule({ appends: [FirstModule] })
export class AppModule {}
