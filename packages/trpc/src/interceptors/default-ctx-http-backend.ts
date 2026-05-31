import { injectable } from '@ditsmod/core';

import { RouteScopedTrpcHttpBackend } from './tokens-and-types.js';
import { TrpcRouteMeta } from '#types/trpc-route-data.js';
import { TrpcOpts } from '#types/types.js';

@injectable()
export class RouteScopedDefaultTrpcHttpBackend implements RouteScopedTrpcHttpBackend {
  constructor(protected routeMeta: TrpcRouteMeta) {}

  async handle(opts: TrpcOpts) {}
}
