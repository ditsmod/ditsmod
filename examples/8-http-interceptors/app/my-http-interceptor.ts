import { Injectable } from '@ts-stack/di';
import { HttpHandler, HttpInterceptor, Logger, Request } from '@ditsmod/core';

@Injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  constructor(private log: Logger) {}

  async intercept(req: Request, next: HttpHandler, ...args: any[]) {
    this.log.info('MyHttpInterceptor works!');

    // Handling request to `HelloWorldController`
    // and you must setting `...args` here.
    const promise = next.handle(req, ...args);

    promise
      .then(() => {
        // You can to do something after.
      })
      .catch((err) => this.log.error(err));

    return promise;
  }
}
