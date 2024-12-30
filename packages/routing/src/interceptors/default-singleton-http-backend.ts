import { injectable, RequestContext } from '@ditsmod/core';

import { RouteMeta } from '../route-data.js';
import { SingletonHttpBackend } from './tokens-and-types.js';


@injectable()
export class DefaultSingletonHttpBackend implements SingletonHttpBackend {
  constructor(protected routeMeta: RouteMeta) {}

  async handle(ctx: RequestContext) {
    return this.routeMeta.routeHandler!(ctx);
  }
}
