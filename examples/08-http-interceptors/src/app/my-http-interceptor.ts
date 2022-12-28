import { injectable, HttpHandler, HttpInterceptor, Logger, Req, Res, RouteMeta } from '@ditsmod/core';

@injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  constructor(private req: Req, private res: Res, private logger: Logger) {}

  intercept(routeMeta: RouteMeta, next: HttpHandler) {
    // Handling request to `HelloWorldController`
    return next.handle(routeMeta).finally(() => {
      // You can to do something after, for example, log status:
      if (this.res.nodeRes.headersSent) {
        this.logger.info(`MyHttpInterceptor works! Status code: ${this.res.nodeRes.statusCode}`);
      } else {
        this.logger.info('MyHttpInterceptor works! But... Do you forgot send response or just an error occurred?');
      }
    });
  }
}
