import { trpcController, TrpcRouteService, trpcRoute } from '@ditsmod/trpc';

import { TrpcContext } from '#app/types.js';
import { BearerGuard } from '#auth/bearer.guard.js';
import { requirePermissions } from '#auth/guards-utils.js';
import { Permission } from '#auth/types.js';

@trpcController()
export class AuthController {
  @trpcRoute([BearerGuard, requirePermissions(Permission.canActivateSomeResource)])
  getAdminRouter(routeService: TrpcRouteService<TrpcContext>) {
    return routeService.procedure.query(() => ({ secret: 'sauce' }));
  }
}
