import { Injectable } from '@ts-stack/di';

import { NodeResponse, NodeRequest } from '../types/server-options';
import { Status } from '../utils/http-status-codes';
import { Logger } from '../types/logger';
import { RequestListener } from '../types/types';
import { HttpMethod, Router } from '../types/router';

@Injectable()
export class PreRequest {
  constructor(protected log: Logger, protected router: Router) {}

  requestListener: RequestListener = (nodeReq, nodeRes) => {
    const { method: httpMethod, url } = nodeReq;
    const [uri, queryString] = this.decodeUrl(url).split('?');
    const { handle: handleRoute, params: pathParams } = this.router.find(httpMethod as HttpMethod, uri);
    if (!handleRoute) {
      this.sendNotFound(nodeRes);
      return;
    }
    handleRoute(nodeReq, nodeRes, pathParams, queryString);
  };

  canNotActivateRoute(nodeReq: NodeRequest, nodeRes: NodeResponse, status?: Status) {
    this.log.debug(`Can not activate the route with URL: ${nodeReq.method} ${nodeReq.url}`);
    nodeRes.statusCode = status || Status.UNAUTHORIZED;
    nodeRes.end();
  }

  /**
   * Logs an error and sends the user message about an internal server error (500).
   *
   * @param err An error to logs it (not sends).
   */
  sendInternalServerError(nodeRes: NodeResponse, err: Error) {
    this.log.error(err);
    nodeRes.statusCode = Status.INTERNAL_SERVER_ERROR;
    nodeRes.end();
  }

  /**
   * Called by the `Application` before call a router.
   */
  protected decodeUrl(url: string) {
    return decodeURI(url);
  }

  /**
   * Called by the `Application` when a route is not found (404).
   */
  protected sendNotFound(nodeRes: NodeResponse) {
    nodeRes.statusCode = Status.NOT_FOUND;
    nodeRes.end();
  }

  /**
   * Logs an error and sends the user message about a bad request error (400).
   *
   * @param err An error to logs it (not sends).
   */
  protected sendBadRequestError(nodeRes: NodeResponse, err: Error) {
    this.log.error(err);
    nodeRes.statusCode = Status.BAD_REQUEST;
    nodeRes.end();
  }
}
