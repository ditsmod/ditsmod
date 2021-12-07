import { BodyParserConfig, HttpHandler, HttpInterceptor, Req } from '@ditsmod/core';
import { Injectable } from '@ts-stack/di';
import { parse, Headers } from 'get-body';

@Injectable()
export class BodyParserInterceptor implements HttpInterceptor {
  constructor(private req: Req, private config: BodyParserConfig) {}

  async intercept(next: HttpHandler) {
    if (!this.config.acceptHeaders.some((type) => this.req.nodeReq.headers['content-type']?.includes(type))) {
      return next.handle();
    }
    this.req.body = await parse(this.req.nodeReq, this.req.nodeReq.headers as Headers, { limit: this.config.maxBodySize });

    return next.handle();
  }
}
