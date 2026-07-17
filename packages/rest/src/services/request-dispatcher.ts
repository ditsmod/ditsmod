import { HttpMethod, injectable, HttpStatus, SystemLogMediator } from '@ditsmod/core';

import { Router } from './router.js';
import { RawRequest, RawResponse } from './request.js';
import { HeadStrategy } from './head-strategy.js';
import { HeadRouteNotSupported } from './rest-errors.js';

@injectable()
export class RequestDispatcher {
  constructor(
    protected router: Router,
    protected systemLogMediator: SystemLogMediator,
    protected headStrategy: HeadStrategy,
  ) {}

  async requestListener(rawReq: RawRequest, rawRes: RawResponse) {
    const [pathname, search] = (rawReq.url || '').split('?');
    let method = rawReq.method as HttpMethod;
    if (method == 'HEAD') {
      method = 'GET';
      rawRes = this.headStrategy.wrap(rawRes);
    }
    const { handle, params } = this.router.find(method, pathname);
    if (!handle) {
      this.sendNotFound(rawRes);  // use real res for error paths
      return;
    }
    await handle(rawReq, rawRes, params, search).catch((err) => {
      this.sendInternalServerError(rawRes, err);
    });
  }

  assertSupportedMethods(httpMethod: HttpMethod, fullPath: string) {
    if (httpMethod == 'HEAD') {
      throw new HeadRouteNotSupported(fullPath);
    }
  }

  /**
   * Logs an error and sends the user message about an internal server error (500).
   *
   * @param err An error to logs it (not sends).
   */
  protected sendInternalServerError(rawRes: RawResponse, err: Error) {
    this.systemLogMediator.internalServerError(this, err);
    rawRes.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    rawRes.end();
  }

  protected sendNotFound(rawRes: RawResponse) {
    rawRes.statusCode = HttpStatus.NOT_FOUND;
    rawRes.end();
  }
}
