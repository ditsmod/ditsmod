import { fromSelf, inject, injectable, optional } from '../di';
import { HTTP_INTERCEPTORS } from '../constans';
import { HttpFrontend, HttpBackend, HttpHandler, HttpInterceptor } from '../types/http-interceptor';

/**
 * An injectable `HttpHandler` that applies multiple interceptors
 * to a request before passing it to the given `HttpBackend`.
 */
@injectable()
export class DefaultHttpHandler implements HttpHandler {
  constructor(
    @fromSelf() private frontend: HttpFrontend,
    @fromSelf() private backend: HttpBackend,
    @fromSelf() @inject(HTTP_INTERCEPTORS) @optional() private interceptors: HttpInterceptor[] = []
  ) {}

  handle(): Promise<any> {
    return [this.frontend, ...this.interceptors]
      .reduceRight((next, interceptor) => new HttpInterceptorHandler(interceptor, next), this.backend)
      .handle();
  }
}

export class HttpInterceptorHandler implements HttpHandler {
  constructor(private interceptor: HttpInterceptor, private next: HttpHandler) {}

  async handle(): Promise<any> {
    await this.interceptor.intercept(this.next);
  }
}
