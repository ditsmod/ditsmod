import { fromSelf, injectable, Injector, RequestContext } from '@ditsmod/core';
import { HttpBackend, DefaultHttpBackend, Status, HttpMethod } from '@ditsmod/core';

@injectable()
export class ReturnHttpBackend extends DefaultHttpBackend implements HttpBackend {
  constructor(protected override injector: Injector, @fromSelf() protected override ctx: RequestContext) {
    super(injector, ctx);
  }

  override async handle() {
    const value = await super.handle(); // Controller's route returned value.
    let { statusCode } = this.ctx.nodeRes;
    if (!statusCode) {
      const httpMethod = this.ctx.nodeReq.method as HttpMethod;
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

    if (typeof value == 'object' || this.ctx.nodeRes.getHeader('content-type') == 'application/json') {
      this.ctx.res.sendJson(value, statusCode);
    } else {
      this.ctx.res.send(value, statusCode);
    }
  }
}
