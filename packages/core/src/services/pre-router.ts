import { IncomingMessage, ServerResponse } from 'node:http';
import { injectable } from '#di';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { HttpMethod } from '#types/mix.js';
import { Router } from '#types/router.js';
import { HttpResponse, RequestListener } from '#types/server-options.js';
import { Status } from '#utils/http-status-codes.js';

@injectable()
export class PreRouter {
  constructor(
    protected router: Router,
    protected systemLogMediator: SystemLogMediator,
  ) {}

  requestListener: RequestListener = async (httpReq, httpRes) => {
    const [pathname, search] = (httpReq.url || '').split('?');
    let method = httpReq.method as HttpMethod;
    if (method == 'HEAD') {
      method = 'GET';
      this.handleHeadMethod(httpRes);
    }
    const { handle, params } = this.router.find(method, pathname);
    if (!handle) {
      this.sendNotImplemented(httpRes);
      return;
    }
    await handle(httpReq, httpRes, params, search).catch((err) => {
      this.sendInternalServerError(httpRes, err);
    });
  };

  /**
   * Logs an error and sends the user message about an internal server error (500).
   *
   * @param err An error to logs it (not sends).
   */
  protected sendInternalServerError(httpRes: HttpResponse, err: Error) {
    this.systemLogMediator.internalServerError(this, err);
    httpRes.statusCode = Status.INTERNAL_SERVER_ERROR;
    httpRes.end();
  }

  protected sendNotImplemented(httpRes: HttpResponse) {
    httpRes.statusCode = Status.NOT_IMPLEMENTED;
    httpRes.end();
  }

  protected handleHeadMethod(httpRes: HttpResponse) {
    let isChunked = false;
    httpRes.write = () => (isChunked = true);
    type Callback = () => void;

    const nodeEnd = httpRes.end.bind(httpRes);
    httpRes.end = function (chunkOrFn?: Callback | string | Buffer, cbOrEncoding?: Callback | BufferEncoding) {
      if (isChunked) {
        if (!httpRes.headersSent) {
          httpRes.setHeader('Transfer-Encoding', 'chunked');
        }
      } else {
        let contentLenght = 0;
        if (chunkOrFn && typeof chunkOrFn != 'function') {
          const encoding: BufferEncoding = !cbOrEncoding || typeof cbOrEncoding == 'function' ? 'utf8' : cbOrEncoding;
          contentLenght = Buffer.byteLength(chunkOrFn, encoding);
        }
        if (!httpRes.headersSent) {
          httpRes.setHeader('Content-Length', contentLenght);
        }
      }
      return nodeEnd() as ServerResponse<IncomingMessage>;
    };
  }
}
