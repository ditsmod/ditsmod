import { featureModule, Injector } from '@ditsmod/core';
import { initTrpcModule, ModuleWithTrpcRoutes } from '@ditsmod/trpc';

import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';

@initTrpcModule({
  controllers: [AuthController],
  providersPerApp: [AuthService],
})
@featureModule()
export class AuthModule implements ModuleWithTrpcRoutes {
  constructor(private inj: Injector) {}

  getRouterConfig() {
    return { admin: { secret: this.inj.get(AuthController.prototype.getAdminRouter) } };
  }
}
