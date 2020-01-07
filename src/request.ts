import { Injectable, Inject, Injector } from 'ts-di';

import { NodeRequest, NodeReqToken } from './types';

@Injectable()
export class Request {
  constructor(@Inject(NodeReqToken) public readonly nodeReq: NodeRequest, public injector: Injector) {}
}
