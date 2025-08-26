import { featureModule } from '@ditsmod/core';
import { initTrpcModule } from '@ditsmod/trpc';

import { MessageController } from './message.controller.js';
import { DbModule } from '#app/modules/db/db.module.js';

@initTrpcModule({
  imports: [DbModule],
  controllers: [MessageController],
})
@featureModule()
export class MessageModule {}
