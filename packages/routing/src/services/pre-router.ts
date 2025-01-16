import { HttpMethod, injectable, Status, SystemLogMediator } from '@ditsmod/core';
import { IncomingMessage, ServerResponse } from 'node:http';

import { Router } from './router.js';
import { RawResponse, RequestListener } from './request.js';


@injectable()
export class PreRouter {
  constructor(
    protected router: Router,
    protected systemLogMediator: SystemLogMediator,
  ) {}

  requestListener: RequestListener = async (rawReq, rawRes) => {
    const [pathname, search] = (rawReq.url || '').split('?');
    let method = rawReq.method as HttpMethod;
    if (method == 'HEAD') {
      method = 'GET';
      this.handleHeadMethod(rawRes);
    }
    const { handle, params } = this.router.find(method, pathname);
    if (!handle) {
      this.sendNotImplemented(rawRes);
      return;
    }
    await handle(rawReq, rawRes, params, search).catch((err) => {
      this.sendInternalServerError(rawRes, err);
    });
  };

  /**
   * Logs an error and sends the user message about an internal server error (500).
   *
   * @param err An error to logs it (not sends).
   */
  protected sendInternalServerError(rawRes: RawResponse, err: Error) {
    this.systemLogMediator.internalServerError(this, err);
    rawRes.statusCode = Status.INTERNAL_SERVER_ERROR;
    rawRes.end();
  }

  protected sendNotImplemented(rawRes: RawResponse) {
    rawRes.statusCode = Status.NOT_IMPLEMENTED;
    rawRes.end();
  }

  protected handleHeadMethod(rawRes: RawResponse) {
    let isChunked = false;
    rawRes.write = () => (isChunked = true);
    type Callback = () => void;

    const rawEnd = rawRes.end.bind(rawRes);
    rawRes.end = function (chunkOrFn?: Callback | string | Buffer, cbOrEncoding?: Callback | BufferEncoding) {
      if (isChunked) {
        if (!rawRes.headersSent) {
          rawRes.setHeader('Transfer-Encoding', 'chunked');
        }
      } else {
        let contentLenght = 0;
        if (chunkOrFn && typeof chunkOrFn != 'function') {
          const encoding: BufferEncoding = !cbOrEncoding || typeof cbOrEncoding == 'function' ? 'utf8' : cbOrEncoding;
          contentLenght = Buffer.byteLength(chunkOrFn, encoding);
        }
        if (!rawRes.headersSent) {
          rawRes.setHeader('Content-Length', contentLenght);
        }
      }
      return rawEnd() as ServerResponse<IncomingMessage>;
    };
  }
}
