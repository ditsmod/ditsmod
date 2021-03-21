import { Injectable } from '@ts-stack/di';
import { HttpHandler, HttpInterceptor, Logger, Request } from '@ditsmod/core';

@Injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  constructor(private log: Logger) {}

  intercept(req: Request, next: HttpHandler, ...args: any[]) {
    // Handling request to `HelloWorldController`
    // and you must setting `...args` here.
    return next.handle(req, ...args).finally(() => {
      // You can to do something after, for example, log status:
      if (req.nodeRes.headersSent) {
        this.log.info(`MyHttpInterceptor works! Status code: ${req.nodeRes.statusCode}`);
      } else {
        this.log.info('MyHttpInterceptor works! But... Do you forgot send response or just an error occurred?');
      }
    });
  }
}
