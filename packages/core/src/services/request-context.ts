import { TLSSocket } from 'node:tls';

import { Res } from '#services/response.js';
import { RawRequest, RawResponse } from '#types/server-options.js';
import { PathParam } from '#types/router.js';
import { AnyObj } from '#types/mix.js';

/**
 * The request context class, which you can substitute with your own class.
 * You can do this at any level, but remember that your class must implement `RequestContext`
 * and must also be passed to the DI registry as a `ValueProvider`
 * like this: `{ token: RequestContext, useValue: MyRequestContext }`.
 *
 * An instance of this class is created without DI.
 */
export class RequestContext extends Res {
  pathParams?: AnyObj;
  queryParams?: AnyObj;
  body?: any;
  auth?: any;

  constructor(
    public rawReq: RawRequest,
    public override rawRes: RawResponse,
    public aPathParams: PathParam[] | null,
    public queryString: string,
  ) {
    super(rawRes);
  }

  get protocol() {
    return this.rawReq.socket instanceof TLSSocket && this.rawReq.socket.encrypted ? 'https' : 'http';
  }
}
