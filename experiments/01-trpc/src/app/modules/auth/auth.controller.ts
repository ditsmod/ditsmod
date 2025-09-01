import { TRPCError } from '@trpc/server';
import { controller, RouteService, trpcRoute } from '@ditsmod/trpc';

import { TrpcContext } from '#app/types.js';

@controller()
export class AuthController {
  @trpcRoute()
  getAdminRouter(routeService: RouteService<TrpcContext>) {
    return routeService.procedure.query(({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      if (ctx.user.name !== 'alex') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      return {
        secret: 'sauce',
      };
    });
  }
}
