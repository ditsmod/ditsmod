import { injectable } from '#di';
import { HttpBackend, SingletonRequestContext } from '#types/http-interceptor.js';
import { RouteMeta } from '#types/route-data.js';

@injectable()
export class DefaultSingletonHttpBackend implements HttpBackend {
  ctx: SingletonRequestContext;

  constructor(protected routeMeta: RouteMeta) {}

  async handle() {
    return this.routeMeta.routeHandler!(this.ctx);
  }
}
