import { featureModule } from '@ditsmod/core';
import { initTrpc } from '@ditsmod/trpc';

import { MessageController } from './message.controller.js';
import { DbModule } from '#app/modules/db/db.module.js';

@initTrpc({
  imports: [DbModule],
  controllers: [MessageController],
})
@featureModule()
export class MessageModule {}
