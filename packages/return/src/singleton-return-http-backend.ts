import { injectable, Status, HttpMethod, DefaultSingletonHttpBackend, SingletonRequestContext } from '@ditsmod/core';

@injectable()
export class SingletonReturnHttpBackend extends DefaultSingletonHttpBackend {
  override async handle(ctx: SingletonRequestContext) {
    const value = await super.handle(ctx); // Controller's route returned value.
    let { statusCode } = ctx.nodeRes;
    if (!statusCode) {
      const httpMethod = ctx.nodeReq.method as HttpMethod;
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

    ctx.nodeRes.statusCode = statusCode;
    if (typeof value == 'object' || ctx.nodeRes.getHeader('content-type') == 'application/json') {
      ctx.nodeRes.setHeader('Content-Type', 'application/json; charset=utf-8');
      ctx.nodeRes.end(JSON.stringify(value));
    } else {
      ctx.nodeRes.end(value);
    }
  }
}
