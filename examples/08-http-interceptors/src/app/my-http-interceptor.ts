import { injectable, Logger, RequestContext } from '@ditsmod/core';
import { HttpHandler, HttpInterceptor } from '@ditsmod/routing';

@injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  constructor(private logger: Logger) {}

  intercept(next: HttpHandler, ctx: RequestContext) {
    // Handling request to `HelloWorldController`
    return next.handle().then((originalMsg: string) => {
      // You can to do something after, for example, log status:
      if (ctx.nodeRes.headersSent) {
        const msg = `MyHttpInterceptor works! Status code: ${ctx.nodeRes.statusCode}`;
        this.logger.log('info', msg);
      } else {
        ctx.nodeRes.setHeader('Content-Type', 'application/json; charset=utf-8');
        const msg = JSON.stringify({ originalMsg, msg: 'message that attached by interceptor' });
        ctx.send(msg);
      }
    });
  }
}
