import { Injectable, Inject } from '@ts-stack/di';

import { NodeReqToken, NodeRequest } from '../types/server-options';
import { Logger } from '../types/logger';
import { BodyParserConfig } from '../models/body-parser-config';

@Injectable()
export class BodyParser {
  constructor(
    @Inject(NodeReqToken) protected readonly nodeReq: NodeRequest,
    protected config: BodyParserConfig,
    protected log: Logger
  ) {}

  getBody(): Promise<any> {
    return;
  }
}
