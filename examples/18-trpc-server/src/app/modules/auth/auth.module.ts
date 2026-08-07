import { RouterOf } from '@holu/trpc/client';
import { ModuleWithTrpcRoutes, trpcModule } from '@holu/trpc';

import { AuthController } from '#auth/auth.controller.js';
import { AuthService } from './auth.service.js';

// For TRPCClient
export type AuthRouter = RouterOf<typeof AuthModule>;

@trpcModule({
  controllers: [AuthController],
  providersPerRou: [AuthService],
})
export class AuthModule implements ModuleWithTrpcRoutes {
  getRouterConfig() {
    return { admin: { secret: AuthController.prototype.getAdminRouter } };
  }
}
