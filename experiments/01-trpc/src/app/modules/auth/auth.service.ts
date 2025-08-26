import { inject, injectable } from '@ditsmod/core';
import { TrpcCreateCtxOpts, TRPC_ROOT } from '@ditsmod/trpc';

import { TrpcRootObj } from '#app/types.js';

@injectable()
export class AuthService {
  constructor(@inject(TRPC_ROOT) protected t: TrpcRootObj) {}

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
