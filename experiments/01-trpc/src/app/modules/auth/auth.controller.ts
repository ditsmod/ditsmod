import { TRPCError } from '@trpc/server';
import { inject } from '@ditsmod/core';
import { TRPC_ROOT, controller, trpcRoute } from '@ditsmod/trpc';

import { TrpcRootObj } from '#app/types.js';

@controller()
export class AuthController {
  constructor(@inject(TRPC_ROOT) protected t: TrpcRootObj) {}

  @trpcRoute()
  getAdminRouter() {
    return this.t.router({
      secret: this.t.procedure.query(({ ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED' });
        }
        if (ctx.user.name !== 'alex') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return {
          secret: 'sauce',
        };
      }),
    });
  }
}
