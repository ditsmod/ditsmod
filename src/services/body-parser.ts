import { Injectable, Inject } from '@ts-stack/di';
import { parse } from 'get-body';

import { BodyParserConfig } from '../types/types';
import { NodeReqToken } from '../types/injection-tokens';
import { NodeRequest } from '../types/server-options';
import { Logger } from '../types/logger';

@Injectable()
export class BodyParser {
  constructor(
    @Inject(NodeReqToken) protected readonly nodeReq: NodeRequest,
    protected config: BodyParserConfig,
    protected log: Logger
  ) {}

  getRawBody(): Promise<Buffer> {
    return;
  }

  getJsonBody(): Promise<any> {
    return parse(this.nodeReq, this.nodeReq.headers, { limit: this.config.maxBodySize });
  }
}
