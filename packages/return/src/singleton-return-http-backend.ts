import { injectable, Status, HttpMethod, SingletonRequestContext } from '@ditsmod/core';
import { DefaultSingletonHttpBackend } from '@ditsmod/routing';

@injectable()
export class SingletonReturnHttpBackend extends DefaultSingletonHttpBackend {
  override async handle(ctx: SingletonRequestContext) {
    const value = await super.handle(ctx); // Controller's route returned value.
    if (ctx.rawRes.headersSent) {
      return value;
    }
    let { statusCode } = ctx.rawRes;
    if (!statusCode) {
      const httpMethod = ctx.rawReq.method as HttpMethod;
      if (httpMethod == 'GET') {
        statusCode = Status.OK;
      } else if (httpMethod == 'POST') {
        statusCode = Status.CREATED;
      } else if (httpMethod == 'OPTIONS') {
        statusCode = Status.NO_CONTENT;
      } else {
        statusCode = Status.OK;
      }
    }

    ctx.rawRes.statusCode = statusCode;
    if (typeof value == 'object' || ctx.rawRes.getHeader('content-type') == 'application/json') {
      ctx.sendJson(value);
    } else {
      ctx.send(value);
    }
  }
}
