import { injectable } from '#di';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { AnyFn, HttpMethod } from '#types/mix.js';
import { Router } from '#types/router.js';
import { NodeResponse, RequestListener } from '#types/server-options.js';
import { Status } from '#utils/http-status-codes.js';

@injectable()
export class PreRouter {
  constructor(
    protected router: Router,
    protected systemLogMediator: SystemLogMediator,
  ) {}

  requestListener: RequestListener = async (nodeReq, nodeRes) => {
    const [pathname, search] = (nodeReq.url || '').split('?');
    let method = nodeReq.method as HttpMethod;
    if (nodeReq.method == 'HEAD') {
      method = 'GET';
      this.handleHeadMethod(nodeRes);
    }
    const { handle, params } = this.router.find(method, pathname);
    if (!handle) {
      this.sendNotImplemented(nodeRes);
      return;
    }
    await handle(nodeReq, nodeRes, params, search).catch((err) => {
      this.sendInternalServerError(nodeRes, err);
    });
  };

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

  protected sendNotImplemented(nodeRes: NodeResponse) {
    nodeRes.statusCode = Status.NOT_IMPLEMENTED;
    nodeRes.end();
  }

  protected handleHeadMethod(nodeRes: NodeResponse) {
    const nodeEnd = nodeRes.end.bind(nodeRes);
    let contentLenght = 0;

    (nodeRes as any).write = (chunk: any, cbOrEncoding?: AnyFn | BufferEncoding) => {
      if (chunk) {
        const encoding: BufferEncoding = !cbOrEncoding || typeof cbOrEncoding == 'function' ? 'utf8' : cbOrEncoding;
        contentLenght += Buffer.byteLength(chunk, encoding);
      }
    };

    (nodeRes as any).end = (chunkOrFn: AnyFn | string | Buffer, cbOrEncoding?: AnyFn | BufferEncoding) => {
      if (chunkOrFn && typeof chunkOrFn != 'function') {
        const encoding: BufferEncoding = !cbOrEncoding || typeof cbOrEncoding == 'function' ? 'utf8' : cbOrEncoding;
        contentLenght += Buffer.byteLength(chunkOrFn, encoding);
      }
      nodeRes.setHeader('Content-Length', contentLenght);
      nodeEnd();
    };
  }
}
