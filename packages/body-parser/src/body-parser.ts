import { Injectable, Inject } from '@ts-stack/di';
import { BodyParserConfig, Logger, NODE_REQ, NodeRequest } from '@ditsmod/core';
import { parse } from 'get-body';


@Injectable()
export class DefaultBodyParser {
  constructor(
    @Inject(NODE_REQ) protected readonly nodeReq: NodeRequest,
    protected config: BodyParserConfig,
    protected log: Logger
  ) {}

  getBody(): Promise<any> {
    return parse(this.nodeReq, this.nodeReq.headers, { limit: this.config.maxBodySize });
  }
}
