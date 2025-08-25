import { featureModule } from '@ditsmod/core';

import { MessageService } from './message.service.js';
import { DbModule } from '#app/modules/db/db.module.js';

@featureModule({
  imports: [DbModule],
  providersPerMod: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
