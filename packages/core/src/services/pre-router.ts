import { Injectable } from '@ts-stack/di';

import { HttpMethod } from '../types/mix';
import { Router } from '../types/router';
import { NodeResponse, RequestListener } from '../types/server-options';
import { Status } from '../utils/http-status-codes';
import { SystemLogMediator } from '../log-mediator/system-log-mediator';

@Injectable()
export class PreRouter {
  constructor(
    protected router: Router,
    protected systemLogMediator: SystemLogMediator
  ) {}

  requestListener: RequestListener = async (nodeReq, nodeRes) => {
    const [uri, queryString] = this.decodeUrl(nodeReq.url || '').split('?', 2);
    const { handle, params } = this.router.find(nodeReq.method as HttpMethod, uri);
    if (!handle) {
      this.sendNotFound(nodeRes);
      return;
    }
    await handle(nodeReq, nodeRes, params!, queryString).catch((err) => {
      this.sendInternalServerError(nodeRes, err);
    });
  };

  protected decodeUrl(url: string) {
    return decodeURI(url);
  }

  /**
   * Logs an error and sends the user message about an internal server error (500).
   *
   * @param err An error to logs it (not sends).
   */
  protected sendInternalServerError(nodeRes: NodeResponse, err: Error) {
    this.systemLogMediator.internalServerError(this, err);
    nodeRes.statusCode = Status.INTERNAL_SERVER_ERROR;
    nodeRes.end();
  }

  protected sendNotFound(nodeRes: NodeResponse) {
    nodeRes.statusCode = Status.NOT_FOUND;
    nodeRes.end();
  }
}
