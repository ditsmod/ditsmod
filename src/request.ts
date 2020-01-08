import { Injectable, Inject, Injector } from 'ts-di';

import { NodeRequest, NodeReqToken, RouteParam } from './types';

@Injectable()
export class Request {
  params: RouteParam[];

  constructor(@Inject(NodeReqToken) public readonly nodeReq: NodeRequest, public injector: Injector) {}
}
