import { restModule } from '@holu/rest';
import { SystemController } from './system.controller.js';

@restModule({
  controllers: [SystemController],
})
export class SystemModule {}
