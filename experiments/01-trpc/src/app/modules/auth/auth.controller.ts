import { TRPCError } from '@trpc/server';
import { controller, proc } from '@ditsmod/trpc';

import { TrpcProc } from '#app/types.js';

@controller()
export class AuthController {
  getAdminRouter(@proc() proc: TrpcProc) {
    return proc.query(({ ctx }) => {
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
