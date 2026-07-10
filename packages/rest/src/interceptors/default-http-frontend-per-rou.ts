import { parse } from 'node:querystring';
import { AnyObj, HttpMethod, injectable, HttpStatus } from '@ditsmod/core';
import { CustomError } from '@ditsmod/core/errors';

import { HttpFrontend, HttpHandler } from './tokens-and-types.js';
import type { RouteContext } from '#services/route-context.js';

@injectable()
export class DefaultHttpFrontendPerRou implements HttpFrontend {
  async intercept(next: HttpHandler, ctx: RouteContext) {
    this.before(ctx).after(ctx, await next.handle());
  }

  /**
   * This method is called before `intercept()`.
   */
  before(ctx: RouteContext) {
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
  after(ctx: RouteContext, val: string | object | Uint8Array | undefined) {
    if (ctx.rawRes.headersSent) {
      return;
    }
    if (!ctx.rawRes.statusCode) {
      const httpMethod = ctx.rawReq.method as HttpMethod;
      if (httpMethod == 'GET') {
        ctx.rawRes.statusCode = HttpStatus.OK;
      } else if (httpMethod == 'POST') {
        ctx.rawRes.statusCode = HttpStatus.CREATED;
      } else if (httpMethod == 'OPTIONS') {
        ctx.rawRes.statusCode = HttpStatus.NO_CONTENT;
      }
    }

    const rawType = ctx.rawRes.getHeader('content-type');
    const contentType = typeof rawType == 'string' ? rawType : undefined;
    if ((typeof val == 'object' && val !== null) || contentType?.startsWith('application/json')) {
      ctx.sendJson(val);
    } else if (contentType && !val) {
      this.throwTypeError(ctx, contentType);
    } else {
      if (typeof val == 'string' && !contentType) {
        ctx.rawRes.setHeader('content-type', 'text/plain; charset=utf-8');
      }
      ctx.send(val);
    }
  }

  protected throwTypeError(ctx: RouteContext, contentType?: string | number | string[]) {
    const msg1 = 'Internal Server Error';
    const route = JSON.stringify({ method: ctx.rawReq.method, url: ctx.rawReq.url });
    let msg2 = `The request handler with route ${route} set the data type to "${contentType}"`;
    msg2 += ' but did not send the response body. Make sure your handler returns a value.';
    throw new CustomError({ msg1, msg2, level: 'error', status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
}
