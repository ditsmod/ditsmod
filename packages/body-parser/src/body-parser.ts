import { Injectable, Inject } from '@ts-stack/di';
import { BodyParserConfig, Logger, NODE_REQ, NodeRequest } from '@ditsmod/core';
import { parse } from 'get-body';


@Injectable()
export class DefaultBodyParser {
  constructor(
    @Inject(NODE_REQ) protected readonly nodeReq: NodeRequest,
    protected config: BodyParserConfig,
    protected logger: Logger
  ) {}

  getBody(): Promise<any> {
    const supportedTypes = ['application/json', 'application/x-www-form-urlencoded', 'text/plain', 'text/html'];
    if (!supportedTypes.some(type => this.nodeReq.headers['content-type'].includes(type))) {
      return;
    }
    return parse(this.nodeReq, this.nodeReq.headers, { limit: this.config.maxBodySize });
  }
}
