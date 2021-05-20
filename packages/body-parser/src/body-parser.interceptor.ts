import { BodyParserConfig, HttpHandler, HttpInterceptor, Request } from '@ditsmod/core';
import { Injectable } from '@ts-stack/di';
import { parse, Headers } from 'get-body';

@Injectable()
export class BodyParserInterceptor implements HttpInterceptor {
  constructor(private req: Request, private config: BodyParserConfig) {}

  async intercept(next: HttpHandler) {
    if (!this.config.acceptHeaders.some((type) => this.req.nodeReq.headers['content-type']?.includes(type))) {
      return;
    }
    this.req.body = await parse(this.req.nodeReq, this.req.nodeReq.headers as Headers, { limit: this.config.maxBodySize });

    next.handle();
  }
}
