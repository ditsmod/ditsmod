import { injectable, HttpHandler, HttpInterceptor, Logger, RequestContext } from '@ditsmod/core';

@injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  constructor(private logger: Logger) {}

  intercept(ctx: RequestContext, next: HttpHandler) {
    // Handling request to `HelloWorldController`
    return next.handle(ctx).finally(() => {
      // You can to do something after, for example, log status:
      if (ctx.res.nodeRes.headersSent) {
        this.logger.info(`MyHttpInterceptor works! Status code: ${ctx.res.nodeRes.statusCode}`);
      } else {
        this.logger.info('MyHttpInterceptor works! But... Do you forgot send response or just an error occurred?');
      }
    });
  }
}
