import { RouterOf } from '@ditsmod/trpc/client';
import { trpcModule, ModuleWithTrpcRoutes } from '@ditsmod/trpc';

import { DbModule } from '#db/db.module.js';
import { MessageController } from '#message/message.controller.js';
import { MessageService } from '#message/message.service.js';

// For TRPCClient
export type MessageRouter = RouterOf<typeof MessageModule>;

@trpcModule({
  imports: [DbModule],
  controllers: [MessageController],
  providersPerMod: [MessageService]
})
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
