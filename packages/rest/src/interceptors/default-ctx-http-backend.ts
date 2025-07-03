import { injectable } from '@ditsmod/core';

import { RouteMeta } from '../types/route-data.js';
import { CtxHttpBackend } from './tokens-and-types.js';
import { RequestContext } from '#services/request-context.js';


@injectable()
export class DefaultCtxHttpBackend implements CtxHttpBackend {
  constructor(protected routeMeta: RouteMeta) {}

  async handle(ctx: RequestContext) {
    return this.routeMeta.routeHandler!(ctx);
  }
}
