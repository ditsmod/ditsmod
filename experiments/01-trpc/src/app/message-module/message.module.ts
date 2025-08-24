import { featureModule } from '@ditsmod/core';

import { MessageService } from './message.service.js';
import { DbModule } from '#app/db-module/db.module.js';

@featureModule({
  imports: [DbModule],
  providersPerMod: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
