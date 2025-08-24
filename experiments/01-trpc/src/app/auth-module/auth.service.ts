import { TRPCError } from '@trpc/server';
import { inject } from '@ditsmod/core';
import { TrcpCreateCtxOpts } from '@ditsmod/trpc';

import { TrcpProcedureFn, TrcpRouterFn, TRPC_PROCEDURE, TRPC_ROUTER } from '#app/root-rpc-object.js';

export class AuthService {
  constructor(
    @inject(TRPC_ROUTER) protected router: TrcpRouterFn,
    @inject(TRPC_PROCEDURE) protected procedure: TrcpProcedureFn,
  ) {}

  getAdminRouter() {
    return this.router({
      secret: this.procedure.query(({ ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED' });
        }
        if (ctx.user?.name !== 'alex') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return {
          secret: 'sauce',
        };
      }),
    });
  }

  createContext = ({ req, res }: TrcpCreateCtxOpts) => {
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
