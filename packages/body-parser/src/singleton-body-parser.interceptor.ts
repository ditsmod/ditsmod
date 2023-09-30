import { HttpHandler, HttpInterceptor, SingletonRequestContext, injectable, optional } from '@ditsmod/core';
import { parse, Headers, Options } from 'get-body';

import { BodyParserConfig } from './body-parser-config.js';

@injectable()
export class SingletonBodyParserInterceptor implements HttpInterceptor {
  constructor(@optional() private config?: BodyParserConfig) {
    this.config = Object.assign({}, new BodyParserConfig(), config); // Merge with default.
  }

  async intercept(next: HttpHandler, ctx: SingletonRequestContext) {
    const contentType = ctx.nodeReq.headers['content-type'];
    const hasAcceptableHeaders = this.config?.acceptHeaders?.some((type) => contentType?.includes(type));
    if (!hasAcceptableHeaders) {
      return next.handle();
    }
    const options: Options = { limit: this.config?.maxBodySize };
    ctx.body = await parse(ctx.nodeReq, ctx.nodeReq.headers as Headers, options);

    return next.handle();
  }
}
