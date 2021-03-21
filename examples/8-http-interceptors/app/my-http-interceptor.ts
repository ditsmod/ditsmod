import { Injectable } from '@ts-stack/di';
import { HttpHandler, HttpInterceptor, Logger, Request } from '@ditsmod/core';

@Injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  constructor(private log: Logger) {}

  async intercept(req: Request, next: HttpHandler, ...args: any[]) {
    // Handling request to `HelloWorldController`
    // and you must setting `...args` here.
    const promise = next.handle(req, ...args);

    promise
      .catch((err) => {
        this.log.error(err);
      })
      .finally(() => {
        // You can to do something after, for example, log status:
        this.log.info(`MyHttpInterceptor works! Status code: ${req.nodeRes.statusCode}`);
      });

    return promise;
  }
}
