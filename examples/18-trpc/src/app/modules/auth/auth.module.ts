import { featureModule } from '@ditsmod/core';
import { RouterOf } from '@ditsmod/trpc/client';
import { initTrpcModule, ModuleWithTrpcRoutes } from '@ditsmod/trpc';

import { AuthController } from '#auth/auth.controller.js';

// For TRPCClient
export type AuthRouter = RouterOf<typeof AuthModule>;

@initTrpcModule({
  controllers: [AuthController],
})
@featureModule()
export class AuthModule implements ModuleWithTrpcRoutes {
  getRouterConfig() {
    return { admin: { secret: AuthController.prototype.getAdminRouter } };
  }
}
