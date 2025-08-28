import { featureModule, Injector } from '@ditsmod/core';
import { initTrpcModule, ModuleWithTrpcRoutes } from '@ditsmod/trpc';

import { DbModule } from '#modules/db/db.module.js';
import { MessageController } from './message.controller.js';
import { MessageService } from './message.service.js';

@initTrpcModule({
  imports: [DbModule],
  controllers: [MessageController],
  providersPerApp: [MessageService]
})
@featureModule()
export class MessageModule implements ModuleWithTrpcRoutes {
  constructor(protected inj: Injector) {}

  getRouterConfig() {
    return {
      message: {
        listMessages: this.inj.get(MessageController.prototype.listMessages),
        addMessage: this.inj.get(MessageController.prototype.addMessage),
      },
      hello: this.inj.get(MessageController.prototype.getHelloRouter),
    };
  }
}
