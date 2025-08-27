import { TRPCError } from '@trpc/server';
import { controller, proc, trpcRoute } from '@ditsmod/trpc';

import { TrpcProc } from '#app/types.js';

@controller()
export class AuthController {
  @trpcRoute()
  getAdminRouter(@proc() proc1: TrpcProc) {
    return proc1.query(({ ctx }) => {
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
