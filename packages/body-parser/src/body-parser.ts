import { Injectable, Inject } from '@ts-stack/di';
import { BodyParserConfig, Logger, NODE_REQ, NodeRequest } from '@ditsmod/core';
import { parse, Headers} from 'get-body';


@Injectable()
export class DefaultBodyParser {
  constructor(
    @Inject(NODE_REQ) protected readonly nodeReq: NodeRequest,
    protected config: BodyParserConfig,
    protected logger: Logger
  ) {}

  async getBody(): Promise<any> {
    if (!this.config.acceptHeaders.some(type => this.nodeReq.headers['content-type']?.includes(type))) {
      return;
    }
    return parse(this.nodeReq, this.nodeReq.headers as Headers, { limit: this.config.maxBodySize });
  }
}
