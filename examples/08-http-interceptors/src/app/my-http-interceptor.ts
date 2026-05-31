import { injectable, Logger } from '@ditsmod/core';
import { HttpHandler, HttpInterceptor, RequestContext } from '@ditsmod/rest';

@injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  constructor(private logger: Logger) {}

  async intercept(next: HttpHandler, reqCtx: RequestContext) {
    const originalMsg = await next.handle(); // Handling request to `HelloWorldController`

    // You can to do something after, for example, log status:
    if (reqCtx.rawRes.headersSent) {
      const msg = `MyHttpInterceptor works! Status code: ${reqCtx.rawRes.statusCode}`;
      this.logger.log('info', msg);
    } else {
      reqCtx.rawRes.setHeader('Content-Type', 'application/json; charset=utf-8');
      const msg = JSON.stringify({ originalMsg, msg: 'message that attached by interceptor' });
      reqCtx.send(msg);
    }

    return originalMsg;
  }
}
