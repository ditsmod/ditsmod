import { injectable, HttpHandler, HttpInterceptor, Logger, RequestContext } from '@ditsmod/core';

@injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  constructor(private logger: Logger) {}

  intercept(next: HttpHandler, ctx: RequestContext) {
    // Handling request to `HelloWorldController`
    return next.handle().finally(() => {
      // You can to do something after, for example, log status:
      if (ctx.nodeRes.headersSent) {
        const msg = `MyHttpInterceptor works! Status code: ${ctx.nodeRes.statusCode}`;
        this.logger.log('info', msg);
      } else {
        const msg = 'MyHttpInterceptor works! But... Do you forgot send response or just an error occurred?';
        this.logger.log('info', msg);
      }
    });
  }
}

@injectable()
export class MySingletonHttpInterceptor implements HttpInterceptor {
  constructor(private logger: Logger) {}

  intercept(next: HttpHandler, ctx: RequestContext) {
    // Handling request to `HelloWorldController`
    return next.handle().finally(() => {
      // You can to do something after, for example, log status:
      if (ctx.nodeRes.headersSent) {
        const msg = `MySingletonHttpInterceptor works! Status code: ${ctx.nodeRes.statusCode}`;
        this.logger.log('info', msg);
      } else {
        const msg = 'MySingletonHttpInterceptor works! But... Do you forgot send response or just an error occurred?';
        this.logger.log('info', msg);
      }
    });
  }
}
