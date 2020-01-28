import { Injectable } from 'ts-di';
import { parse } from 'querystring';

import { NodeResponse } from './types/types';
import { Status } from './http-status-codes';

@Injectable()
export class PreRequest {
  /**
   * Called by the `BootstrapModule` before call a router.
   *
   * In inherited class you can to use standart `decodeURI(url)` function.
   * See inheritance in the docs.
   */
  decodeUrl(url: string) {
    return decodeURI(url);
  }

  /**
   * Called by the `BootstrapModule` when a route is not found.
   */
  sendNotFound(nodeRes: NodeResponse) {
    nodeRes.statusCode = Status.NOT_FOUND;
    nodeRes.end();
  }
}
