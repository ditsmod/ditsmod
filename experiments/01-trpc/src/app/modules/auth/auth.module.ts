import { featureModule, Injector } from '@ditsmod/core';
import { initTrpcModule, TrpcModuleWithRouterConfig } from '@ditsmod/trpc';

import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';

@initTrpcModule({
  controllers: [AuthController],
  providersPerApp: [AuthService],
})
@featureModule()
export class AuthModule implements TrpcModuleWithRouterConfig {
  constructor(private inj: Injector) {}

  getRouterConfig() {
    return { admin: { secret: this.inj.get(AuthController.prototype.getAdminRouter) } };
  }
}
