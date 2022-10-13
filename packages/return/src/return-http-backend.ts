import { Injectable, Injector } from '@ts-stack/di';
import { RouteMeta, HttpBackend, Res, DefaultHttpBackend, Status, HttpMethod, NODE_REQ } from '@ditsmod/core';

@Injectable()
export class ReturnHttpBackend extends DefaultHttpBackend implements HttpBackend {
  constructor(protected override injector: Injector, protected override routeMeta: RouteMeta, protected res: Res) {
    super(injector, routeMeta);
  }

  override async handle() {
    const value = await super.handle(); // Controller's route returned value.
    let { statusCode } = this.res.nodeRes;
    if (!statusCode) {
      const nodeReq = this.injector.get(NODE_REQ);
      const httpMethod = nodeReq.method as HttpMethod;
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

    if (typeof value == 'object' || this.res.nodeRes.getHeader('content-type') == 'application/json') {
      this.res.sendJson(value, statusCode);
    } else {
      this.res.send(value, statusCode);
    }
  }
}
