import { AnyObj } from '@ditsmod/core';
import { TLSSocket } from 'node:tls';

import { RawRequest, RawResponse } from './request.js';
import { Res } from './response.js';
import { PathParam } from './router.js';



/**
 * The request context class, which you can substitute with your own class.
 * You can do this at any level, but remember that your class must implement `RequestContext`
 * and must also be passed to the DI registry as a `ValueProvider`
 * like this: `{ token: RequestContext, useValue: MyRequestContext }`.
 *
 * An instance of this class is created without DI.
 */
export class RequestContext extends Res {
  declare pathParams?: AnyObj;
  declare queryParams?: AnyObj;
  declare body?: any;
  declare auth?: any;

  constructor(
    public rawReq: RawRequest,
    public override rawRes: RawResponse,
    public aPathParams: PathParam[] | null,
    public queryString: string,
    /**
     * Indicates in which mode the controller methods work.
     * 
     * The operation of the controller in `ctx` mode means that its methods,
     * which are bound to routes, receive a single argument - an object containing 
     * context data, including native request objects.
     */
    public scope?: 'ctx',
  ) {
    super(rawRes);
  }

  get protocol() {
    return this.rawReq.socket instanceof TLSSocket && this.rawReq.socket.encrypted ? 'https' : 'http';
  }
}
