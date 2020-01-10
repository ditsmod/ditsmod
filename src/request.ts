import { Injectable, Inject, Injector } from 'ts-di';
import { format } from 'util';
import { ParsedUrlQuery } from 'querystring';

import { NodeRequest, NodeReqToken, RouteParam } from './types';

@Injectable()
export class Request {
  params: RouteParam[];
  queryParams: ParsedUrlQuery;

  constructor(@Inject(NodeReqToken) public readonly nodeReq: NodeRequest, public injector: Injector) {}

  toString(): string {
    let headers = '';
    Object.keys(this.nodeReq.headers).forEach(k => (headers += format('%s: %s\n', k, this.nodeReq.headers[k])));

    const { method, url, httpVersion } = this.nodeReq;
    return format('%s %s HTTP/%s\n%s', method, url, httpVersion, headers);
  }
}
