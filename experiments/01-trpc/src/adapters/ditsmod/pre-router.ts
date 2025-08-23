import { HttpMethod, inject, injectable, SystemLogMediator } from '@ditsmod/core';
import { RequestListener } from 'node:http';
import { internal_exceptionHandler, nodeHTTPRequestHandler } from '@trpc/server/adapters/node-http';

import { TRPC_OPTS } from './constants.js';
import { TrcpOpts } from './types.js';

@injectable()
export class PreRouter {
  constructor(
    @inject(TRPC_OPTS) protected opts: TrcpOpts,
    protected systemLogMediator: SystemLogMediator,
  ) {}

  requestListener: RequestListener = async (req, res) => {
    const [fullPath, search] = (req.url || '').split('?');
    const method = req.method as HttpMethod;

    if (fullPath == '/') {
      res.end('hello');
    } else if (fullPath?.startsWith('/trpc')) {
      const path = fullPath.slice(fullPath.lastIndexOf('/') + 1);
      try {
        await nodeHTTPRequestHandler({
          ...this.opts,
          req,
          res,
          path,
        });
      } catch (err) {
        internal_exceptionHandler({
          req,
          res,
          path,
          ...this.opts,
        })(err);
      }
      // request logger
      console.log('⬅️ ', req.method, path, (req as any).body ?? search);
    } else {
      res.end(JSON.stringify({ method, path: fullPath, search }));
    }
  };
}
