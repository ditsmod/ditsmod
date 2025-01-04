import { parse } from 'node:querystring';
import { AnyObj, CustomError, HttpMethod, injectable, RequestContext, Status } from '@ditsmod/core';

import { HttpFrontend, HttpHandler } from './tokens-and-types.js';

@injectable()
export class DefaultCtxHttpFrontend implements HttpFrontend {
  async intercept(next: HttpHandler, ctx: RequestContext) {
    this.before(ctx).after(ctx, await next.handle());
  }

  /**
   * This method is called before `intercept()`.
   */
  before(ctx: RequestContext) {
    if (ctx.queryString) {
      ctx.queryParams = parse(ctx.queryString);
    }
    if (ctx.aPathParams?.length) {
      const pathParams: AnyObj = {};
      ctx.aPathParams.forEach((param) => (pathParams[param.key] = param.value));
      ctx.pathParams = pathParams;
    }
    return this;
  }

  /**
   * This method is called after `intercept()`.
   */
  after(ctx: RequestContext, val: any) {
    if (ctx.rawRes.headersSent) {
      return;
    }
    if (!ctx.rawRes.statusCode) {
      const httpMethod = ctx.rawReq.method as HttpMethod;
      if (httpMethod == 'GET') {
        ctx.rawRes.statusCode = Status.OK;
      } else if (httpMethod == 'POST') {
        ctx.rawRes.statusCode = Status.CREATED;
      } else if (httpMethod == 'OPTIONS') {
        ctx.rawRes.statusCode = Status.NO_CONTENT;
      }
    }

    const contentType = ctx.rawRes.getHeader('content-type');
    if (typeof val == 'object' || contentType?.toString().includes('application/json')) {
      ctx.sendJson(val);
    } else if (contentType && !val) {
      this.throwTypeError(ctx, contentType);
    } else {
      ctx.send(val);
    }
  }

  protected throwTypeError(ctx: RequestContext, contentType?: string | number | string[]) {
    const msg1 = 'Internal Server Error';
    const route = JSON.stringify({ method: ctx.rawReq.method, url: ctx.rawReq.url });
    let msg2 = `The request handler with route ${route} set the data type to "${contentType}"`;
    msg2 += ' but did not send the response body. Make sure your handler returns a value.';
    throw new CustomError({ msg1, msg2, level: 'error', status: Status.INTERNAL_SERVER_ERROR });
  }
}
