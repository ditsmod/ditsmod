import { CustomError, injectable, Status } from '@ditsmod/core';

import { HttpFrontend, HttpHandler } from './tokens-and-types.js';
import { RequestContext } from '#services/request-context.js';

@injectable()
export class DefaultCtxHttpFrontend implements HttpFrontend {
  async intercept(next: HttpHandler, ctx: RequestContext) {
    return this.before(ctx).after(ctx, await next.handle());
  }

  /**
   * This method is called before `intercept()`.
   */
  before(ctx: RequestContext) {
    return this;
  }

  /**
   * This method is called after `intercept()`.
   */
  after(ctx: RequestContext, val: any) {
    return val;
  }

  protected throwTypeError(ctx: RequestContext, contentType?: string | number | string[]) {
    const msg1 = 'Internal Server Error';
    const route = JSON.stringify({ method: ctx.rawReq.method, url: ctx.rawReq.url });
    let msg2 = `The request handler with route ${route} set the data type to "${contentType}"`;
    msg2 += ' but did not send the response body. Make sure your handler returns a value.';
    throw new CustomError({ msg1, msg2, level: 'error', status: Status.INTERNAL_SERVER_ERROR });
  }
}
