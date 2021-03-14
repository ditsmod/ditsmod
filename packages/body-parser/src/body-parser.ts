import { Injectable, Inject } from '@ts-stack/di';
import { BodyParserConfig, Logger, NodeReqToken, NodeRequest } from '@ts-stack/ditsmod';
import { parse } from 'get-body';


@Injectable()
export class DefaultBodyParser {
  constructor(
    @Inject(NodeReqToken) protected readonly nodeReq: NodeRequest,
    protected config: BodyParserConfig,
    protected log: Logger
  ) {}

  getBody(): Promise<any> {
    return parse(this.nodeReq, this.nodeReq.headers, { limit: this.config.maxBodySize });
  }
}
