import { inject, injectable, optional } from '../di/index.js';
import { HTTP_INTERCEPTORS } from '../constans.js';
import {
  HttpFrontend,
  HttpBackend,
  HttpInterceptor,
  HttpInterceptorHandler,
  HttpHandler,
} from '../types/http-interceptor.js';

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
