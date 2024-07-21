import { HttpHandler, HttpInterceptor, SingletonRequestContext, injectable } from '@ditsmod/core';
import { BodyParserGroup } from '@ts-stack/body-parser';

@injectable()
export class SingletonBodyParserInterceptor implements HttpInterceptor {
  constructor(private bodyParserGroup: BodyParserGroup) {}

  async intercept(next: HttpHandler, ctx: SingletonRequestContext) {
    ctx.body = await this.bodyParserGroup.parse(ctx.nodeReq, ctx.nodeReq.headers, {});

    return next.handle();
  }
}
