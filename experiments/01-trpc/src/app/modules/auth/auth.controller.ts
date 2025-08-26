import { TRPCError } from '@trpc/server';
import { inject } from '@ditsmod/core';
import { TRPC_ROOT, controller, proc, trpcRoute } from '@ditsmod/trpc';

import { TrpcProc, TrpcRootObj } from '#app/types.js';

@controller()
export class AuthController {
  @trpcRoute()
  getAdminRouter(@inject(TRPC_ROOT) t: TrpcRootObj, @proc() proc1: TrpcProc) {
    return t.router({
      secret: proc1.query(({ ctx }) => {
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
