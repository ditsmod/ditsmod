import { CustomError, injectable, Status } from '@ditsmod/core';

import { TrpcHttpFrontend, TrpcHttpHandler } from './tokens-and-types.js';
import { TrpcOpts } from '#types/types.js';

@injectable()
export class DefaultCtxTrpcHttpFrontend implements TrpcHttpFrontend {
  async intercept(next: TrpcHttpHandler, opts: TrpcOpts) {
    return this.before(opts).after(opts, await next.handle());
  }

  /**
   * This method is called before `intercept()`.
   */
  before(opts: TrpcOpts) {
    return this;
  }

  /**
   * This method is called after `intercept()`.
   */
  after(opts: TrpcOpts, val: any) {
    return val;
  }

  protected throwTypeError(opts: TrpcOpts, contentType?: string | number | string[]) {
    const msg1 = 'Internal Server Error';
    const route = JSON.stringify({ method: '', url: opts.ctx.req.url });
    let msg2 = `The request handler with route ${route} set the data type to "${contentType}"`;
    msg2 += ' but did not send the response body. Make sure your handler returns a value.';
    throw new CustomError({ msg1, msg2, level: 'error', status: Status.INTERNAL_SERVER_ERROR });
  }
}
