import { injectable } from '#di';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { HttpMethod } from '#types/mix.js';
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
    let method: HttpMethod;
    if (nodeReq.method == 'HEAD') {
      method = 'GET';
      this.handleHeadMethod(nodeRes);
    } else {
      method = nodeReq.method as HttpMethod;
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
    const originEnd = nodeRes.end.bind(nodeRes);
    (nodeRes as any).end = (...args: any[]) => {
      let contentLenght = 0;
      if (args[0] && typeof args[0] != 'function') {
        const encoding: BufferEncoding = !args[1] || typeof args[1] == 'function' ? 'utf8' : args[1];
        contentLenght = Buffer.byteLength(args[0], encoding);
      }
      nodeRes.setHeader('Content-Length', contentLenght);
      originEnd();
    };
  }
}
