import {
  injectable,
  HttpHandler,
  HttpInterceptor,
  Logger,
  fromSelf,
  inject,
  NodeResponse,
  NODE_RES,
} from '@ditsmod/core';

@injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  constructor(private logger: Logger, @fromSelf() @inject(NODE_RES) private nodeRes: NodeResponse) {}

  intercept(next: HttpHandler) {
    // Handling request to `HelloWorldController`
    return next.handle().finally(() => {
      // You can to do something after, for example, log status:
      if (this.nodeRes.headersSent) {
        this.logger.info(`MyHttpInterceptor works! Status code: ${this.nodeRes.statusCode}`);
      } else {
        this.logger.info('MyHttpInterceptor works! But... Do you forgot send response or just an error occurred?');
      }
    });
  }
}
