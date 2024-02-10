import { injectable, HttpHandler, HttpInterceptor, Logger, RequestContext } from '@ditsmod/core';

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
        const msg = JSON.stringify({ originalMsg, msg: 'message that attached by regular interceptor' });
        ctx.nodeRes.end(msg);
      }
    });
  }
}

@injectable()
export class MySingletonHttpInterceptor implements HttpInterceptor {
  constructor(private logger: Logger) {}

  intercept(next: HttpHandler, ctx: RequestContext) {
    // Handling request to `HelloWorldController`
    return next.handle().then((originalMsg: string) => {
      // You can to do something after, for example, log status:
      if (ctx.nodeRes.headersSent) {
        const msg = `MySingletonHttpInterceptor works! Status code: ${ctx.nodeRes.statusCode}`;
        this.logger.log('info', msg);
      } else {
        const msg = JSON.stringify({ originalMsg, msg: 'message that attached by singleton interceptor' });
        ctx.nodeRes.end(msg);
      }
    });
  }
}
