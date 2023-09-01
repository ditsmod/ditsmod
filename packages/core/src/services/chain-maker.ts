import { HTTP_INTERCEPTORS } from '#constans';
import { inject, injectable, optional } from '#di';
import {
  HttpBackend,
  HttpFrontend,
  HttpHandler,
  HttpInterceptor,
  HttpInterceptorHandler,
} from '#types/http-interceptor.js';

/**
 * An injectable `ChainMaker` that ties multiple interceptors in chain.
 */
@injectable()
export class ChainMaker {
  makeChain(
    frontend: HttpFrontend,
    backend: HttpBackend,
    @inject(HTTP_INTERCEPTORS) @optional() interceptors: HttpInterceptor[] = [],
  ): HttpHandler {
    return [frontend, ...interceptors].reduceRight(
      (next, interceptor) => new HttpInterceptorHandler(interceptor, next),
      backend,
    );
  }
}
