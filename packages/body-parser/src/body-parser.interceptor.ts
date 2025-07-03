import { Injector, injectable } from '@ditsmod/core';
import { RequestContext, HttpHandler, HttpInterceptor } from '@ditsmod/rest';
import { BodyParserGroup } from '@ts-stack/body-parser';

import { HTTP_BODY } from './body-parser-config.js';

@injectable()
export class BodyParserInterceptor implements HttpInterceptor {
  constructor(
    private injector: Injector,
    private bodyParserGroup: BodyParserGroup,
  ) {}

  async intercept(next: HttpHandler, ctx: RequestContext) {
    ctx.body = await this.bodyParserGroup.parse(ctx.rawReq, ctx.rawReq.headers, {});
    this.injector.setByToken(HTTP_BODY, ctx.body);

    return next.handle();
  }
}
