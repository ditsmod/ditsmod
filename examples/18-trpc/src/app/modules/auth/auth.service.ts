import { injectable } from '@ditsmod/core';
import { TrpcCreateCtxOpts } from '@ditsmod/trpc';

@injectable()
export class AuthService {
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
