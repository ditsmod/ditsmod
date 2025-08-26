import { TRPCError } from '@trpc/server';
import { inject, injectable } from '@ditsmod/core';
import { TrpcCreateCtxOpts, TRPC_ROOT } from '@ditsmod/trpc';

import { TrpcRootObj } from '#app/types.js';

@injectable()
export class AuthService {
  constructor(@inject(TRPC_ROOT) protected t: TrpcRootObj) {}

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

  createContext = ({ req, res }: TrpcCreateCtxOpts) => {
    const getUser = () => {
      if (req.headers.authorization !== 'secret') {
        return null;
      }
      return {
        name: 'alex',
      };
    };

    return {
      req,
      res,
      user: getUser(),
    };
  };
}
