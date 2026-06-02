import { injectable } from '@ditsmod/core';

import { RouteMeta } from '../types/route-data.js';
import { RouteScopedHttpBackend } from './tokens-and-types.js';
import { RequestContext } from '#services/request-context.js';


@injectable()
export class RouteScopedDefaultHttpBackend implements RouteScopedHttpBackend {
  constructor(protected routeMeta: RouteMeta) {}

  async handle(reqCtx: RequestContext) {
    return this.routeMeta.routeHandler!(reqCtx);
  }
}
