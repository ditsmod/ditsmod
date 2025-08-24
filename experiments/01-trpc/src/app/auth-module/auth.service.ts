import { TrcpCreateCtxOpts } from '../../adapters/ditsmod/types.js';

export class AuthService {
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
