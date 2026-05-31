import { parse } from 'node:querystring';
import { AnyObj, HttpMethod, injectable, Status, type Context } from '@ditsmod/core';
import { CustomError } from '@ditsmod/core/errors';

import { HttpFrontend, HttpHandler } from './tokens-and-types.js';
import { A_PATH_PARAMS, PATH_PARAMS, QUERY_PARAMS, QUERY_STRING, RAW_REQ, RAW_RES } from '#types/constants.js';
import { Res } from '#services/response.js';

@injectable()
export class RouteScopedDefaultHttpFrontend implements HttpFrontend {
  async intercept(next: HttpHandler, ctx: Context) {
    this.before(ctx).after(ctx, await next.handle());
  }

  /**
   * This method is called before `intercept()`.
   */
  before(ctx: Context) {
    if (ctx.has(QUERY_STRING, true)) {
      ctx.set(QUERY_PARAMS, parse(ctx.get(QUERY_STRING, true)!));
    }
    if (ctx.has(A_PATH_PARAMS, true)) {
      const pathParams: AnyObj = {};
      ctx.get(A_PATH_PARAMS, true)!.forEach((param) => (pathParams[param.key] = param.value));
      ctx.set(PATH_PARAMS, pathParams)!;
    }
    return this;
  }

  /**
   * This method is called after `intercept()`.
   */
  after(ctx: Context, val: string | object | Uint8Array | undefined) {
    const rawRes = ctx.get(RAW_RES, true)!;
    if (rawRes.headersSent) {
      return;
    }
    if (!rawRes.statusCode) {
      const httpMethod = ctx.get(RAW_REQ, true)!.method as HttpMethod;
      if (httpMethod == 'GET') {
        rawRes.statusCode = Status.OK;
      } else if (httpMethod == 'POST') {
        rawRes.statusCode = Status.CREATED;
      } else if (httpMethod == 'OPTIONS') {
        rawRes.statusCode = Status.NO_CONTENT;
      }
    }

    const rawType = rawRes.getHeader('content-type');
    const contentType = typeof rawType == 'string' ? rawType : undefined;
    if ((typeof val == 'object' && val !== null) || contentType?.startsWith('application/json')) {
      ctx.get(Res)!.sendJson(val);
    } else if (contentType && !val) {
      this.throwTypeError(ctx, contentType);
    } else {
      if (typeof val == 'string' && !contentType) {
        rawRes.setHeader('content-type', 'text/plain; charset=utf-8');
      }
      ctx.get(Res)!.send(val);
    }
  }

  protected throwTypeError(ctx: Context, contentType?: string | number | string[]) {
    const msg1 = 'Internal Server Error';
    const route = JSON.stringify({ method: ctx.get(RAW_REQ, true)!.method, url: ctx.get(RAW_REQ, true)!.url });
    let msg2 = `The request handler with route ${route} set the data type to "${contentType}"`;
    msg2 += ' but did not send the response body. Make sure your handler returns a value.';
    throw new CustomError({ msg1, msg2, level: 'error', status: Status.INTERNAL_SERVER_ERROR });
  }
}
