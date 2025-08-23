import { HttpMethod, inject, injectable, SystemLogMediator } from '@ditsmod/core';
import { RequestListener } from 'node:http';
import {
  internal_exceptionHandler,
  NodeHTTPHandlerOptions,
  nodeHTTPRequestHandler,
} from '@trpc/server/adapters/node-http';
import { AnyTRPCRouter } from '@trpc/server';

import { TRPC_OPTS } from './constants.js';

@injectable()
export class PreRouter {
  constructor(
    @inject(TRPC_OPTS) protected opts: NodeHTTPHandlerOptions<AnyTRPCRouter, any, any>,
    protected systemLogMediator: SystemLogMediator,
  ) {}

  requestListener: RequestListener = async (req, res) => {
    // eslint-disable-next-line prefer-const
    let [path, search] = (req.url || '').split('?');
    const method = req.method as HttpMethod;
    console.log(path?.startsWith('/trpc'), JSON.stringify({ method, path, search }));

    if (path == '/') {
      res.end('hello');
    } else if (path?.startsWith('/trpc')) {
      path = path.slice(path.lastIndexOf('/') + 1);
      try {
        await nodeHTTPRequestHandler({
          ...this.opts,
          req: req as any,
          res: res as any,
          path,
        });
      } catch (err) {
        internal_exceptionHandler({
          req: req as any,
          res: res as any,
          path,
          ...this.opts,
        });
      }
      // request logger
      console.log('⬅️ ', req.method, path, (req as any).body ?? search);
      //
    } else {
      res.end(JSON.stringify({ method, path, search }));
    }
  };
}
