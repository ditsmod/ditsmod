import { injectable, RequestContext } from '@ditsmod/core';

import { RouteMeta } from '../route-data.js';
import { CtxHttpBackend } from './tokens-and-types.js';


@injectable()
export class DefaultCtxHttpBackend implements CtxHttpBackend {
  constructor(protected routeMeta: RouteMeta) {}

  async handle(ctx: RequestContext) {
    return this.routeMeta.routeHandler!(ctx);
  }
}
