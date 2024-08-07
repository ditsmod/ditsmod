import { HttpHandler, HttpInterceptor, Injector, RequestContext, injectable } from '@ditsmod/core';
import { BodyParserGroup } from '@ts-stack/body-parser';

import { HTTP_BODY } from './body-parser-config.js';

@injectable()
export class BodyParserInterceptor implements HttpInterceptor {
  constructor(
    private injector: Injector,
    private bodyParserGroup: BodyParserGroup,
  ) {}

  async intercept(next: HttpHandler, ctx: RequestContext) {
    const body = await this.bodyParserGroup.parse(ctx.nodeReq, ctx.nodeReq.headers, {});
    this.injector.setByToken(HTTP_BODY, body);

    return next.handle();
  }
}
