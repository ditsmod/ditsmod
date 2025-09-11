import { injectable } from '@ditsmod/core';

import { CtxTrpcHttpBackend } from './tokens-and-types.js';
import { TrpcRouteMeta } from '#types/trpc-route-data.js';
import { TrpcOpts } from '#types/types.js';

@injectable()
export class DefaultCtxTrpcHttpBackend implements CtxTrpcHttpBackend {
  constructor(protected routeMeta: TrpcRouteMeta) {}

  async handle(opts: TrpcOpts) {}
}
