import { featureModule, Injector } from '@ditsmod/core';
import { initTrpcModule, TrpcModuleWithRouterConfig } from '@ditsmod/trpc';

import { MessageController } from './message.controller.js';
import { DbModule } from '#app/modules/db/db.module.js';

@initTrpcModule({
  imports: [DbModule],
  controllers: [MessageController],
})
@featureModule()
export class MessageModule implements TrpcModuleWithRouterConfig {
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
