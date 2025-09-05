import { injectable } from '@ditsmod/core';

import { CtxHttpBackend } from './tokens-and-types.js';
import { RequestContext } from '#services/request-context.js';
import { TrpcRouteMeta } from '#types/trpc-route-data.js';


@injectable()
export class DefaultCtxHttpBackend implements CtxHttpBackend {
  constructor(protected routeMeta: TrpcRouteMeta) {}

  async handle(ctx: RequestContext) {
    return this.routeMeta.routeHandler!(ctx);
  }
}
