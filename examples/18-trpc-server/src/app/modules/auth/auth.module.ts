import { RouterOf } from '@ditsmod/trpc/client';
import { ModuleWithTrpcRoutes, trpcModule } from '@ditsmod/trpc';

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
