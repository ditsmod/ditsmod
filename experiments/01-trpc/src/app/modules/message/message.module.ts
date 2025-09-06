import { featureModule } from '@ditsmod/core';
import { RouterOf } from '@ditsmod/trpc/client';
import { initTrpcModule, ModuleWithTrpcRoutes } from '@ditsmod/trpc';

import { DbModule } from '#modules/db/db.module.js';
import { MessageController } from './message.controller.js';
import { MessageService } from './message.service.js';

// For TRPCClient
export type MessageRouter = RouterOf<typeof MessageModule>;

@initTrpcModule({
  imports: [DbModule],
  controllers: [MessageController],
  providersPerMod: [MessageService]
})
@featureModule()
export class MessageModule implements ModuleWithTrpcRoutes {
  getRouterConfig() {
    return {
      message: {
        listMessages: MessageController.prototype.listMessages,
        addMessage: MessageController.prototype.addMessage,
      },
      hello: MessageController.prototype.getHelloRouter,
    };
  }
}
