import { injectable } from '#di';
import { SingletonHttpBackend, SingletonRequestContext } from '#interceptors/tokens-and-types.js';
import { RouteMeta } from '#types/route-data.js';

@injectable()
export class DefaultSingletonHttpBackend implements SingletonHttpBackend {
  constructor(protected routeMeta: RouteMeta) {}

  async handle(ctx: SingletonRequestContext) {
    return this.routeMeta.routeHandler!(ctx);
  }
}
