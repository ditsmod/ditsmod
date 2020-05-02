import { Injectable } from '@ts-stack/di';

import { NodeResponse, NodeRequest } from '../types/server-options';
import { Status } from '../utils/http-status-codes';
import { Logger } from '../types/logger';

@Injectable()
export class PreRequest {
  constructor(protected log: Logger) {}

  /**
   * Called by the `ModuleFactory` before call a router.
   */
  decodeUrl(url: string) {
    return decodeURI(url);
  }

  /**
   * Called by the `ModuleFactory` when a route is not found.
   */
  sendNotFound(nodeRes: NodeResponse) {
    nodeRes.statusCode = Status.NOT_FOUND;
    nodeRes.end();
  }

  /**
   * Logs an error and sends the user message about an internal server error.
   *
   * @param err An error to logs it (not sends).
   */
  sendInternalServerError(nodeRes: NodeResponse, err: Error) {
    this.log.error(err);
    nodeRes.statusCode = Status.INTERNAL_SERVER_ERROR;
    nodeRes.end();
  }

  /**
   * Logs an error and sends the user message about a bad request error.
   *
   * @param err An error to logs it (not sends).
   */
  sendBadRequestError(nodeRes: NodeResponse, err: Error) {
    this.log.error(err);
    nodeRes.statusCode = Status.BAD_REQUEST;
    nodeRes.end();
  }

  canNotActivateRoute(nodeReq: NodeRequest, nodeRes: NodeResponse, status?: Status) {
    this.log.debug(`Can not activate the route with URL: ${nodeReq.url}`);
    nodeRes.statusCode = status || Status.UNAUTHORIZED;
    nodeRes.end();
  }
}
