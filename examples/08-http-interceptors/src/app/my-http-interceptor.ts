import { injectable, HttpHandler, HttpInterceptor, Logger, RequestContext } from '@ditsmod/core';

@injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  constructor(private logger: Logger, private ctx: RequestContext) {}

  intercept(next: HttpHandler) {
    // Handling request to `HelloWorldController`
    return next.handle().finally(() => {
      // You can to do something after, for example, log status:
      if (this.ctx.nodeRes.headersSent) {
        this.logger.info(`MyHttpInterceptor works! Status code: ${this.ctx.nodeRes.statusCode}`);
      } else {
        this.logger.info('MyHttpInterceptor works! But... Do you forgot send response or just an error occurred?');
      }
    });
  }
}
