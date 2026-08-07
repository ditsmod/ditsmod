import { restModule } from '@holu/rest';
import { FirstController } from './first/first.controller.js';

@restModule({ controllers: [FirstController] })
export class FirstModule {}
