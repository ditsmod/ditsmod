import { restModule } from '@ditsmod/rest';
import { FirstController } from './first/first.controller.js';

@restModule({ controllers: [FirstController] })
export class FirstModule {}
