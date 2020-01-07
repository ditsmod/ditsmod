import { Injectable, Inject } from 'ts-di';

import { NodeRequest, NodeResponse, NodeReqToken, NodeResToken } from './types';
import { Request } from './request';

@Injectable()
export class Response {
  constructor(
    @Inject(NodeReqToken) public readonly nodeReq: NodeRequest,
    @Inject(NodeResToken) public readonly nodeRes: NodeResponse,
    protected req: Request
  ) {}

  send(data: string | Buffer | Uint8Array) {
    this.nodeRes.end(data);
  }
}
