import { Res } from '#services/response.js';
import { HttpRequest, HttpResponse } from '#types/server-options.js';
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
  constructor(
    public httpReq: HttpRequest,
    public override httpRes: HttpResponse,
    public aPathParams: PathParam[] | null,
    public queryString: string
  ) {
    super(httpRes);
  }
}

export class SingletonRequestContext extends RequestContext {
  pathParams?: AnyObj;
  queryParams?: AnyObj;
  body?: AnyObj;
  auth?: AnyObj;
}
