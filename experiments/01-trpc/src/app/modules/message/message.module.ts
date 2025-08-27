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
  constructor(private inj: Injector) {}

  getRouterConfig() {
    return {
      message: this.inj.get(MessageController.prototype.getMessageRouter),
      hello: this.inj.get(MessageController.prototype.getHelloRouter),
    };
  }
}
