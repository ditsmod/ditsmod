import { injectable, type Context } from '@ditsmod/core';

import { RouteMeta } from '../types/route-data.js';
import { RouteScopedHttpBackend } from './tokens-and-types.js';


@injectable()
export class RouteScopedDefaultHttpBackend implements RouteScopedHttpBackend {
  constructor(protected routeMeta: RouteMeta) {}

  async handle(ctx: Context) {
    return this.routeMeta.routeHandler!(ctx);
  }
}
