import {
  inject,
  injectable,
  Injector,
  NodeRequest,
  NODE_REQ,
  Res,
  RouteMeta,
  skipSelf,
  DefaultHttpBackend,
  Status,
  HttpMethod,
} from '@ditsmod/core';

@injectable()
export class ReturnHttpBackend extends DefaultHttpBackend {
  constructor(
    @inject(NODE_REQ) protected nodeReq: NodeRequest,
    @skipSelf() protected override routeMeta: RouteMeta,
    protected override injector: Injector,
    protected res: Res,
  ) {
    super(injector, routeMeta);
  }

  override async handle() {
    const value = await super.handle(); // Controller's route returned value.
    if (this.res.nodeRes.headersSent) {
      return value;
    }
    let { statusCode } = this.res.nodeRes;
    if (!statusCode) {
      const httpMethod = this.nodeReq.method as HttpMethod;
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

    if (
      typeof value == 'object' ||
      this.res.nodeRes.getHeader('content-type')?.toString().includes('application/json')
    ) {
      this.res.sendJson(value, statusCode);
    } else {
      this.res.send(value, statusCode);
    }

    return value;
  }
}
