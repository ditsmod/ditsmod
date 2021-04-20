import { Injectable, Inject } from '@ts-stack/di';

import { NodeRequest } from '../types/server-options';
import { Logger } from '../types/logger';
import { BodyParserConfig } from '../models/body-parser-config';
import { NODE_REQ } from '../constans';

@Injectable()
export class BodyParser {
  constructor(
    @Inject(NODE_REQ) protected readonly nodeReq: NodeRequest,
    protected config: BodyParserConfig,
    protected logger: Logger
  ) {}

  getBody(): Promise<any> {
    return;
  }
}
