import type { AnyObj, Injector } from '@ditsmod/core';
import { TLSSocket } from 'node:tls';

import type { RawRequest, RawResponse } from './request.js';
import { Res } from './response.js';
import type { PathParam } from './router.js';

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
    injector: Injector,
    public rawReq: RawRequest,
    public override rawRes: RawResponse,
    public aPathParams: PathParam[] | null,
    public queryString: string,
    /**
     * Indicates in which mode the controller methods work.
     *
     * The operation of the controller in `route` mode means that its methods,
     * which are bound to routes, receive a single argument - an object containing
     * context data, including native request objects.
     */
    public scope?: 'route',
  ) {
    super(rawRes, injector);
  }

  get protocol() {
    return this.rawReq.socket instanceof TLSSocket && this.rawReq.socket.encrypted ? 'https' : 'http';
  }
}
