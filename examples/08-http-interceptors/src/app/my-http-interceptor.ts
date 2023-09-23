import { injectable, HttpHandler, HttpInterceptor, Logger, InterceptorContext } from '@ditsmod/core';

@injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  constructor(private logger: Logger) {}

  intercept(next: HttpHandler, ctx: InterceptorContext) {
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
