import { HttpMethod, injectable, SystemLogMediator } from '@ditsmod/core';
import { RequestListener } from 'node:http';

@injectable()
export class PreRouter {
  constructor(
    // protected router: any,
    protected systemLogMediator: SystemLogMediator,
  ) {}

  requestListener: RequestListener = async (rawReq, rawRes) => {
    const [pathname, search] = (rawReq.url || '').split('?');
    const method = rawReq.method as HttpMethod;
    rawRes.end(JSON.stringify({ method, pathname, search }));
    //
  };
}
