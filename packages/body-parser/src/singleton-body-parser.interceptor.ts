import { BodyParserGroup } from '@ts-stack/body-parser';
import { RequestContext, injectable } from '@ditsmod/core';
import { HttpHandler, HttpInterceptor } from '@ditsmod/routing';

@injectable()
export class SingletonBodyParserInterceptor implements HttpInterceptor {
  constructor(private bodyParserGroup: BodyParserGroup) {}

  async intercept(next: HttpHandler, ctx: RequestContext) {
    ctx.body = await this.bodyParserGroup.parse(ctx.rawReq, ctx.rawReq.headers, {});

    return next.handle();
  }
}
